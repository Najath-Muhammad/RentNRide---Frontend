import { useFcmToast } from "../../hooks/useFcmToast";

export default function FcmToastContainer() {
    const { toasts, dismiss } = useFcmToast();

    if (toasts.length === 0) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: "1rem",
                right: "1rem",
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
                maxWidth: "24rem",
                width: "100%",
            }}
            aria-live="polite"
            aria-atomic="false"
        >
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    role="alert"
                    style={{
                        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                        border: "1px solid rgba(99, 102, 241, 0.4)",
                        borderRadius: "0.75rem",
                        padding: "1rem 1.25rem",
                        boxShadow:
                            "0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.15)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                        animation: "fcm-slide-in 0.3s ease",
                    }}
                >
                    {}
                    <div
                        style={{
                            width: "2.25rem",
                            height: "2.25rem",
                            borderRadius: "50%",
                            background: "rgba(99, 102, 241, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontSize: "1.1rem",
                        }}
                    >
                        🔔
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                color: "#e2e8f0",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {toast.title}
                        </p>
                        <p
                            style={{
                                margin: "0.25rem 0 0",
                                fontSize: "0.8125rem",
                                color: "#94a3b8",
                                lineHeight: 1.4,
                            }}
                        >
                            {toast.body}
                        </p>
                    </div>

                    <button
                        onClick={() => dismiss(toast.id)}
                        aria-label="Dismiss notification"
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#64748b",
                            fontSize: "1.1rem",
                            padding: "0",
                            lineHeight: 1,
                            flexShrink: 0,
                            transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#e2e8f0";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
                        }}
                    >
                        ✕
                    </button>
                </div>
            ))}
            <style>{`
                @keyframes fcm-slide-in {
                    from { opacity: 0; transform: translateX(2rem); }
                    to   { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
