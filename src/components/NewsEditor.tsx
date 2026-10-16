"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { notify } from "./toast";
interface NewsEditorProps {
  value: string;
  onChange: (html: string) => void;
}

// Componente reutilizable para los botones de la barra de herramientas
interface ToolbarButtonProps {
  label: React.ReactNode;
  active: boolean;
  onClick: () => void;
  className?: string;
}

function ToolbarButton({
  label,
  active,
  onClick,
  className = "",
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? "bg-slate-800 border-slate-700 text-blue-400"
          : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
      } ${className}`}
    >
      {label}
    </button>
  );
}

export default function NewsEditor({ value, onChange }: NewsEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        code: false,
        codeBlock: false,
        horizontalRule: false,
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
      }),
    ],
    content: value,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "news-content min-h-[250px] p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 focus:outline-none focus:border-slate-700",
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="space-y-3">
      {/* Barra de herramientas */}
      <div className="flex flex-wrap gap-1.5 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <ToolbarButton
          label="B"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="font-bold"
        />
        <ToolbarButton
          label="I"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="italic"
        />
        <ToolbarButton
          label="U"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="underline"
        />
        <ToolbarButton
          label="S"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="line-through"
        />
        <ToolbarButton
          label="H2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className="font-bold"
        />
        <ToolbarButton
          label="H3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className="font-bold"
        />
        <ToolbarButton
          label="• List"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. List"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="“ Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href;
            const url = window.prompt(
              "Introduce la URL del enlace:",
              previousUrl,
            );

            if (url === null) {
              return;
            }

            if (url.trim() === "") {
              editor.chain().focus().unsetLink().run();
              return;
            }

            const isValidProtocol = /^https?:\/\/|^mailto:/i.test(url);
            if (!isValidProtocol) {
                notify.error("La URL debe comenzar con http://, https:// o mailto:")
              return;
            }

            editor.chain().focus().setLink({ href: url }).run();
          }}
          className="underline"
        />
      </div>

      {/* Contenido editable del editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
