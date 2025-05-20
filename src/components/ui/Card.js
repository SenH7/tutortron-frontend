/**
 * Card component for displaying content in a bordered container
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional classes
 */
const Card = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-white dark:bg-black/20 border border-black/10 dark:border-white/10 rounded-xl p-6 shadow-sm ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;