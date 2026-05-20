import Loader from './Loader';

export default function Button({
  children,
  className = 'btn',
  isLoading = false,
  disabled = false,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={className}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader size="sm" /> : children}
    </button>
  );
}
