type PageStateProps =
  | { kind: 'loading'; message?: string }
  | { kind: 'error'; message: string; onRetry?: () => void };

export default function PageState(props: PageStateProps) {
  if (props.kind === 'loading') {
    return (
      <div className="page-state" role="status" aria-live="polite">
        <span className="page-state__spinner" aria-hidden="true" />
        <p>{props.message || 'Loading data…'}</p>
      </div>
    );
  }

  return (
    <div className="page-state page-state--error" role="alert">
      <i className="fas fa-triangle-exclamation" aria-hidden="true" />
      <p>{props.message}</p>
      {props.onRetry && <button type="button" className="btn btn-outline btn-sm" onClick={props.onRetry}>Retry</button>}
    </div>
  );
}
