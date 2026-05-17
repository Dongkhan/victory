import { useRef, useState } from 'react';

// 자식을 감싸 드래그앤드롭 파일 전송을 받는 영역.
export default function FileDropZone({ onFiles, children }) {
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  return (
    <div
      className="dropzone"
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        depth.current -= 1;
        if (depth.current <= 0) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        const files = [...(e.dataTransfer?.files || [])];
        if (files.length) onFiles(files);
      }}
    >
      {children}
      {dragging && <div className="dropzone__overlay">파일을 놓으면 전송됩니다</div>}
    </div>
  );
}
