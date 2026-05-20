export default function Loader({ size = 'md', className = '' }) {
  const sizeClass = size === 'lg' ? 'loader-lg' : size === 'sm' ? 'loader-sm' : '';
  const classes = ['loader', sizeClass, className].filter(Boolean).join(' ');

  return <span className={classes} />;
}
