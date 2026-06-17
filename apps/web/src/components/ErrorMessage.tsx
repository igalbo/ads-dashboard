type Props = {
  message: string | null;
};

export function ErrorMessage({ message }: Props) {
  return message ? <p className="error">{message}</p> : null;
}
