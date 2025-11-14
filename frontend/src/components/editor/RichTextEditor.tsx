import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Digite aqui...',
  readOnly = false
}: RichTextEditorProps) {

  // Toolbar minimalista: apenas itálico, marca-texto e indentação
  const modules = useMemo(() => ({
    toolbar: readOnly ? false : [
      ['italic'],  // Itálico
      [{ 'background': ['#ffff00', '#ff6b6b', '#4ecdc4', '#95e1d3', '#f38181', '#feca57'] }],  // Marca-texto (6 cores)
      [{ 'indent': '-1'}, { 'indent': '+1' }]  // Indentação
    ]
  }), [readOnly]);

  // Formatos permitidos
  const formats = [
    'italic',
    'background',
    'indent'
  ];

  return (
    <div className='quill-wrapper h-full'>
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        theme='snow'
        className='h-full'
      />

      <style>{`
        .quill-wrapper {
          display: flex;
          flex-direction: column;
        }

        .quill-wrapper .quill {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .quill-wrapper .ql-container {
          flex: 1;
          overflow-y: auto;
          font-size: 16px;
          line-height: 1.8;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .quill-wrapper .ql-editor {
          padding: 24px;
          min-height: 100%;
          white-space: pre-wrap;
        }

        .quill-wrapper .ql-editor p {
          margin-bottom: 1em;
        }

        /* Esconder toolbar quando readonly */
        .quill-wrapper.read-only .ql-toolbar {
          display: none;
        }

        /* Estilo da toolbar */
        .ql-toolbar {
          border-top: none !important;
          border-left: none !important;
          border-right: none !important;
          background: #f9fafb;
          padding: 12px 16px;
        }

        .ql-container {
          border: none !important;
        }

        /* Espaçamento dos botões */
        .ql-toolbar .ql-formats {
          margin-right: 15px;
        }

        /* Labels customizados */
        .ql-toolbar button.ql-italic:after {
          content: 'Itálico';
          position: absolute;
          top: -25px;
          left: 50%;
          transform: translateX(-50%);
          background: #333;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
        }

        .ql-toolbar button.ql-italic:hover:after {
          opacity: 1;
        }

        /* Indentação visível */
        .ql-editor .ql-indent-1 { padding-left: 3em; }
        .ql-editor .ql-indent-2 { padding-left: 6em; }
        .ql-editor .ql-indent-3 { padding-left: 9em; }
        .ql-editor .ql-indent-4 { padding-left: 12em; }
        .ql-editor .ql-indent-5 { padding-left: 15em; }
      `}</style>
    </div>
  );
}
