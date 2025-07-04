export const NotificationBar = ({ message }) => (
    <div className="fixed top-4 right-4 bg-[#23272f] text-white px-4 py-2 rounded-lg shadow-lg z-50">
      {message}
    </div>
  );