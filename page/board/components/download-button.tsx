"use client";

type DownloadButtonProps = {
  onClick: () => void;
};

export function DownloadButton({ onClick }: DownloadButtonProps) {
  return (
    <button className="download-button" onClick={onClick} type="button">
      TXT
    </button>
  );
}
