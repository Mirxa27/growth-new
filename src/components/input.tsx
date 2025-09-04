import React from 'react';

interface InputProps {
  value: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextInput: React.FC<InputProps> = (props) => {
  return (
    <input
      value={props.value}
      onChange={props.onChange || (() => {})} // added default onChange handler
    />
  );
};

export default TextInput;