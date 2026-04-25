import UploadButton from "./UploadButton";

export default function TopBar() {
  return (
    <header className="topbar">
      <span className="topbar-title">TimeView</span>
      <div className="topbar-right">
        <UploadButton />
      </div>
    </header>
  );
}
