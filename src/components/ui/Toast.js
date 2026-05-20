export default function Toast({ toast, onDismiss }) {
  return (
    <div
      className={`toast toast-${toast.type}`}
      onClick={() => onDismiss(toast.id)}
    >
      <span>
        {toast.type === 'success' && '✅ '}
        {toast.type === 'error' && '❌ '}
        {toast.type === 'info' && 'ℹ️ '}
      </span>
      <span>{toast.message}</span>
    </div>
  );
}
