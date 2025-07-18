# backend/chat_storage.py - FIXED VERSION
import sqlite3
import json
import datetime
import uuid
import time
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class ChatStorage:
    def __init__(self, db_path='chats.db'):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the chat database with required tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create chats table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_flagged BOOLEAN DEFAULT FALSE,
                    flag_reason TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Create messages table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_flagged BOOLEAN DEFAULT FALSE,
                    flag_reason TEXT,
                    metadata TEXT, -- JSON field for additional data
                    FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
                )
            ''')
            
            # Create users table (if not exists)
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    role TEXT DEFAULT 'student',
                    status TEXT DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Create indexes for better performance
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats (user_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats (updated_at)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages (is_flagged)')
            
            conn.commit()
            logger.info("✓ Chat database initialized successfully")
    
    def _generate_unique_id(self, prefix=""):
        """Generate a guaranteed unique ID"""
        # Use UUID4 for guaranteed uniqueness
        unique_id = str(uuid.uuid4())
        if prefix:
            return f"{prefix}_{unique_id}"
        return unique_id
    
    def create_chat(self, user_id: str, title: str, chat_id: str = None) -> str:
        """Create a new chat"""
        if not chat_id:
            chat_id = self._generate_unique_id("chat")
        
        # If chat_id starts with temp_, replace it with a proper UUID
        if chat_id.startswith('temp_'):
            chat_id = self._generate_unique_id("chat")
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Check if chat already exists
            cursor.execute('SELECT id FROM chats WHERE id = ?', (chat_id,))
            if cursor.fetchone():
                # Chat already exists, return existing ID
                logger.info(f"Chat {chat_id} already exists")
                return chat_id
            
            cursor.execute('''
                INSERT INTO chats (id, user_id, title, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ''', (chat_id, user_id, title))
            conn.commit()
            
        logger.info(f"Created chat {chat_id} for user {user_id}")
        return chat_id
    
    def get_user_chats(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get all chats for a user"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, title, created_at, updated_at, is_flagged, flag_reason,
                       (SELECT COUNT(*) FROM messages WHERE chat_id = chats.id) as message_count
                FROM chats 
                WHERE user_id = ? 
                ORDER BY updated_at DESC 
                LIMIT ?
            ''', (user_id, limit))
            
            chats = []
            for row in cursor.fetchall():
                chats.append({
                    'id': row['id'],
                    'title': row['title'],
                    'created_at': row['created_at'],
                    'updated_at': row['updated_at'],
                    'is_flagged': bool(row['is_flagged']),
                    'flag_reason': row['flag_reason'],
                    'message_count': row['message_count']
                })
            
            return chats
    
    def get_chat_with_messages(self, chat_id: str, user_id: str = None) -> Optional[Dict]:
        """Get a chat with all its messages"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get chat info
            query = 'SELECT * FROM chats WHERE id = ?'
            params = [chat_id]
            
            if user_id:  # For regular users, check ownership
                query += ' AND user_id = ?'
                params.append(user_id)
            
            cursor.execute(query, params)
            chat_row = cursor.fetchone()
            
            if not chat_row:
                return None
            
            # Get messages
            cursor.execute('''
                SELECT * FROM messages 
                WHERE chat_id = ? 
                ORDER BY timestamp ASC
            ''', (chat_id,))
            
            messages = []
            for msg_row in cursor.fetchall():
                metadata = json.loads(msg_row['metadata']) if msg_row['metadata'] else {}
                messages.append({
                    'id': msg_row['id'],
                    'role': msg_row['role'],
                    'content': msg_row['content'],
                    'timestamp': msg_row['timestamp'],
                    'is_flagged': bool(msg_row['is_flagged']),
                    'flag_reason': msg_row['flag_reason'],
                    'metadata': metadata
                })
            
            return {
                'id': chat_row['id'],
                'user_id': chat_row['user_id'],
                'title': chat_row['title'],
                'created_at': chat_row['created_at'],
                'updated_at': chat_row['updated_at'],
                'is_flagged': bool(chat_row['is_flagged']),
                'flag_reason': chat_row['flag_reason'],
                'messages': messages
            }
    
    def add_message(self, chat_id: str, role: str, content: str, message_id: str = None, 
                   is_flagged: bool = False, flag_reason: str = None, metadata: Dict = None) -> str:
        """Add a message to a chat - FIXED VERSION"""
        if not message_id:
            message_id = self._generate_unique_id(f"{role}_msg")
        
        metadata_json = json.dumps(metadata) if metadata else None
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Check if message already exists (prevent duplicates)
            cursor.execute('SELECT id FROM messages WHERE id = ?', (message_id,))
            if cursor.fetchone():
                logger.warning(f"Message {message_id} already exists, skipping insert")
                return message_id
            
            # Add message with retry logic for uniqueness
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    cursor.execute('''
                        INSERT INTO messages (id, chat_id, role, content, timestamp, is_flagged, flag_reason, metadata)
                        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
                    ''', (message_id, chat_id, role, content, is_flagged, flag_reason, metadata_json))
                    
                    # Update chat timestamp
                    cursor.execute('''
                        UPDATE chats SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
                    ''', (chat_id,))
                    
                    conn.commit()
                    break
                    
                except sqlite3.IntegrityError as e:
                    if "UNIQUE constraint failed" in str(e) and attempt < max_retries - 1:
                        # Generate a new unique ID and retry
                        message_id = self._generate_unique_id(f"{role}_msg")
                        logger.warning(f"Message ID collision, retrying with new ID: {message_id}")
                        continue
                    else:
                        logger.error(f"Failed to insert message after {max_retries} attempts: {e}")
                        raise e
        
        logger.info(f"Added {role} message to chat {chat_id}")
        return message_id
    
    def update_chat_title(self, chat_id: str, title: str, user_id: str = None) -> bool:
        """Update chat title"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = 'UPDATE chats SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            params = [title, chat_id]
            
            if user_id:  # For regular users, check ownership
                query += ' AND user_id = ?'
                params.append(user_id)
            
            cursor.execute(query, params)
            conn.commit()
            
            return cursor.rowcount > 0
    
    def delete_chat(self, chat_id: str, user_id: str = None) -> bool:
        """Delete a chat and all its messages"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            query = 'DELETE FROM chats WHERE id = ?'
            params = [chat_id]
            
            if user_id:  # For regular users, check ownership
                query += ' AND user_id = ?'
                params.append(user_id)
            
            cursor.execute(query, params)
            conn.commit()
            
            return cursor.rowcount > 0
    
    def flag_chat(self, chat_id: str, flag_reason: str) -> bool:
        """Flag a chat for admin review"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE chats 
                SET is_flagged = TRUE, flag_reason = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (flag_reason, chat_id))
            conn.commit()
            
            return cursor.rowcount > 0
    
    def flag_message(self, message_id: str, flag_reason: str) -> bool:
        """Flag a message for admin review"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE messages 
                SET is_flagged = TRUE, flag_reason = ? 
                WHERE id = ?
            ''', (flag_reason, message_id))
            conn.commit()
            
            return cursor.rowcount > 0
    
    def get_flagged_content(self, limit: int = 100) -> Dict:
        """Get flagged chats and messages for admin review"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get flagged chats
            cursor.execute('''
                SELECT c.*, u.name as user_name, u.email as user_email
                FROM chats c
                JOIN users u ON c.user_id = u.id
                WHERE c.is_flagged = TRUE
                ORDER BY c.updated_at DESC
                LIMIT ?
            ''', (limit,))
            
            flagged_chats = [dict(row) for row in cursor.fetchall()]
            
            # Get flagged messages
            cursor.execute('''
                SELECT m.*, c.title as chat_title, u.name as user_name, u.email as user_email
                FROM messages m
                JOIN chats c ON m.chat_id = c.id
                JOIN users u ON c.user_id = u.id
                WHERE m.is_flagged = TRUE
                ORDER BY m.timestamp DESC
                LIMIT ?
            ''', (limit,))
            
            flagged_messages = [dict(row) for row in cursor.fetchall()]
            
            return {
                'flagged_chats': flagged_chats,
                'flagged_messages': flagged_messages
            }
    
    def get_all_chats_for_admin(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get all chats for admin monitoring"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT c.*, u.name as user_name, u.email as user_email,
                       (SELECT COUNT(*) FROM messages WHERE chat_id = c.id) as message_count,
                       (SELECT COUNT(*) FROM messages WHERE chat_id = c.id AND is_flagged = TRUE) as flagged_message_count
                FROM chats c
                JOIN users u ON c.user_id = u.id
                ORDER BY c.updated_at DESC
                LIMIT ? OFFSET ?
            ''', (limit, offset))
            
            return [dict(row) for row in cursor.fetchall()]
    
    def create_or_update_user(self, user_id: str, name: str, email: str, role: str = 'student'):
        """Create or update user record"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO users (id, name, email, role, last_active)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (user_id, name, email, role))
            conn.commit()
    
    def get_chat_statistics(self) -> Dict:
        """Get chat statistics for admin dashboard"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Total chats
            cursor.execute('SELECT COUNT(*) FROM chats')
            total_chats = cursor.fetchone()[0]
            
            # Total messages
            cursor.execute('SELECT COUNT(*) FROM messages')
            total_messages = cursor.fetchone()[0]
            
            # Flagged content
            cursor.execute('SELECT COUNT(*) FROM chats WHERE is_flagged = TRUE')
            flagged_chats = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM messages WHERE is_flagged = TRUE')
            flagged_messages = cursor.fetchone()[0]
            
            # Active users (last 7 days)
            cursor.execute('''
                SELECT COUNT(DISTINCT user_id) FROM chats 
                WHERE updated_at > datetime('now', '-7 days')
            ''')
            active_users = cursor.fetchone()[0]
            
            return {
                'total_chats': total_chats,
                'total_messages': total_messages,
                'flagged_chats': flagged_chats,
                'flagged_messages': flagged_messages,
                'active_users': active_users
            }

# Initialize global chat storage instance
chat_storage = ChatStorage()