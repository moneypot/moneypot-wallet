import React, { useRef } from 'react';

type Props = {
  className: string;
  style: object | undefined;
  text: string;
  children: any;
};

export default function CopyToClipboard(props: Props) {
  const textAreaRef = useRef(null);

  function copy() {
    const textarea = textAreaRef.current as any;
    let { text } = props;

    textarea.value = text;
    textarea.select();

    try {
      const successful = document.execCommand('copy');
      const msg = successful ? 'successful' : 'unsuccessful';
    } catch (err) {
      alert(`Oops, unable to copy (${err.message})`);
    }
  }
  const attr = {
    style: props.style,
    className: props.className,
  };

  return (
    <p>
      <button onClick={() => copy()} {...attr}>
        {props.children}
      </button>
      <textarea ref={textAreaRef} style={{ position: 'absolute', top: '-1000px' }} />
    </p>
  );
}
