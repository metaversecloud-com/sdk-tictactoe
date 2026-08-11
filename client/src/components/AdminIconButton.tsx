export const AdminIconButton = ({
  onClick,
  isAdminView,
}: {
  onClick: () => void;
  isAdminView: boolean;
}) => (
  <button
    className="btn btn-icon icon-with-rounded-border"
    aria-label={isAdminView ? "Back to game" : "Open admin panel"}
    onClick={onClick}
  >
    <img
      alt=""
      src={`https://sdk-style.s3.amazonaws.com/icons/${isAdminView ? "arrow" : "cog"}.svg`}
    />
  </button>
);

export default AdminIconButton;
