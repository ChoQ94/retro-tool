"use client";

type AccessGateProps = {
  error: string;
  password: string;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
};

export function AccessGate({ error, password, onChangePassword, onSubmit }: AccessGateProps) {
  return (
    <main className="page-shell access-shell">
      <div className="access-modal">
        <h1>비밀번호를 입력해 주세요</h1>
        <p>이 회고 보드는 비밀번호를 입력한 뒤에만 볼 수 있습니다.</p>
        <input
          className="access-modal__input"
          type="password"
          value={password}
          onChange={(event) => onChangePassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
          placeholder="비밀번호 입력"
        />
        {error ? <p className="access-modal__error">{error}</p> : null}
        <button className="button button--primary access-modal__button" onClick={onSubmit} type="button">
          입장하기
        </button>
      </div>
    </main>
  );
}
