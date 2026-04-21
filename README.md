# Retro Tool

Next.js와 Firebase Firestore를 이용해 만드는 회고 보드 초안입니다.

## 포함된 기능

- 기본 섹션 3개: `잘한점`, `부족한점`, `노력한점`
- 섹션 이름 인라인 수정
- 카드 추가 / 수정 / 삭제
- Firestore `boards/main` 문서에 저장

## 시작 방법

1. 의존성 설치
2. Firebase 프로젝트 `woogobee`에서 Firestore 데이터베이스 생성
3. 아래 규칙 또는 인증 정책 설정
4. `npm run dev`

Firebase Web SDK 설정은 현재 [lib/firebase.ts](/Users/choq/Fount/retro-tool/lib/firebase.ts)에 직접 연결되어 있습니다.

`kilshot` 컬렉션에서 특정 문서를 읽고 싶다면 빌드 전에 `.env.local`에 아래 값을 넣으세요.

```txt
NEXT_PUBLIC_RETRO_DOC_ID=your-firestore-document-id
```

지정하지 않으면 `kilshot` 컬렉션의 첫 번째 문서를 읽습니다.

## 배포

- 정적 export 결과물 `out`을 Firebase Hosting에 배포합니다.
- 기본 프로젝트와 사이트는 `woogobee`로 설정되어 있습니다.
- 배포 명령: `npm run deploy`

## Firestore 예시 보안 규칙

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /boards/{boardId} {
      allow read, write: if true;
    }
  }
}
```
