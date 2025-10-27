import ReactDOM from "react-dom";

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDeleteModal({
  title,
  message,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
      {/* Modal box */}
      <div className="bg-white text-gray-800 rounded-lg shadow-xl w-[360px] max-w-[90%] animate-scaleIn border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600 mt-2 mb-6">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 shadow-sm transition"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>,
    modalRoot
  );
}
