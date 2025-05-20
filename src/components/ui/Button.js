import Link from 'next/link';

/**
 * Button component that can be rendered as a button element or Link
 * 
 * @param {Object} props
 * @param {string} props.variant - 'primary' or 'secondary'
 * @param {string} props.size - 'sm', 'md', or 'lg'
 * @param {string} props.href - If provided, button will be rendered as a Link
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional classes
 * @param {function} props.onClick - onClick handler
 */
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  href, 
  children, 
  className = '',
  onClick,
  ...props 
}) => {
  // Base classes for all buttons
  const baseClasses = 'rounded-full font-medium transition-colors flex items-center justify-center';
  
  // Classes for different variants
  const variantClasses = {
    primary: 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]',
    secondary: 'border border-black/[.08] dark:border-white/[.145] hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent'
  };
  
  // Classes for different sizes
  const sizeClasses = {
    sm: 'text-xs h-8 px-3',
    md: 'text-sm h-10 px-4',
    lg: 'text-base h-12 px-5'
  };
  
  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  // If href is provided, render as Link
  if (href) {
    return (
      <Link href={href} className={buttonClasses} {...props}>
        {children}
      </Link>
    );
  }
  
  // Otherwise render as button
  return (
    <button className={buttonClasses} onClick={onClick} {...props}>
      {children}
    </button>
  );
};

export default Button;