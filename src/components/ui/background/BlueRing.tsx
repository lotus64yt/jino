export function BgBlueRing() {
    return (
        <div
            style={{
                position: "fixed",
                inset: "0",
                zIndex: "-1",
                background: "radial-gradient(circle, rgba(59,131,246,0.297) 0%, rgba(59,130,246,0) 100%)",
                pointerEvents: "none",
            }}
        ></div>
    );
}