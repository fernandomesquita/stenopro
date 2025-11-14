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

  // Converter plain text para HTML se necessário
  const convertedValue = useMemo(() => {
    if (!value) return '';

    console.log('[RichTextEditor] Value recebido:', {
      length: value.length,
      isHTML: value.includes('<p>') || value.includes('<div>'),
      preview: value.substring(0, 200)
    });

    // Se já é HTML, usar direto
    if (value.includes('<p>') || value.includes('<div>') || value.includes('<br>')) {
      console.log('[RichTextEditor] ✅ Já é HTML');
      return value;
    }

    // Se é plain text, converter para HTML preservando quebras de linha
    console.log('[RichTextEditor] 🔄 Convertendo plain text para HTML');
    const htmlValue = value
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para.length > 0)
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('');

    console.log('[RichTextEditor] ✅ Convertido, length:', htmlValue.length);
    return htmlValue;
  }, [value]);

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

  const handleChange = (content: string) => {
    console.log('[RichTextEditor] onChange:', {
      length: content.length,
      preview: content.substring(0, 100)
    });
    onChange(content);
  };

  // Se não tem conteúdo, mostrar placeholder
  if (!convertedValue && readOnly) {
    return (
      <div className='p-6 text-gray-400 text-center'>
        Nenhum conteúdo disponível
      </div>
    );
  }

  return (
    <div className='quill-wrapper h-full'>
      <ReactQuill
        value={convertedValue}
        onChange={handleChange}
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

        .quill-wrapper .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: italic;
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
