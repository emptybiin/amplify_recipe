# 드림노트 — iOS 빌드 가이드

맥 + Xcode + 애플 개발자 계정 기준으로, 같은 코드를 아이폰 앱으로 만드는 방법입니다.
안드로이드 빌드와 **코드는 동일**하고, iOS 프로젝트만 추가하면 됩니다.
명령어는 모두 이 폴더(`dream-note`) 안에서 실행하세요.

---

## 0. 준비물 확인

- **Xcode** 설치됨 (App Store에서 설치).
- 터미널에서 아래를 한 번 실행해 CocoaPods가 있는지 확인:
  ```bash
  pod --version
  ```
  버전이 안 나오면 설치:
  ```bash
  sudo gem install cocoapods
  ```
- 애플 개발자 계정 (있음).

---

## 1. iOS 프로젝트 추가 (최초 1회)

```bash
npm install            # 아직 안 했다면
npm run build
npx cap add ios
```

`ios` 폴더가 생기면 성공입니다.

---

## 2. 권한 설명문 추가 (필수)

`ios/App/App/Info.plist` 파일을 열어, `<dict>` 안 아무 곳에 아래 항목을 추가하세요.
이게 없으면 음성 기능에서 앱이 크래시 나거나 심사에서 거부됩니다.

```xml
<key>NSMicrophoneUsageDescription</key>
<string>꿈을 음성으로 기록하기 위해 마이크를 사용합니다.</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>말한 내용을 글로 옮겨 꿈을 기록하기 위해 음성 인식을 사용합니다.</string>
```

> Xcode에서 Info.plist를 열면 표 형태로 보일 수 있어요. 그땐 빈 줄에서 `+`를 눌러
> 위 두 key를 추가하고 설명을 입력하면 됩니다.

---

## 3. 빌드 → 동기화 → Xcode 열기

코드를 고칠 때마다 이 한 줄이면 됩니다.

```bash
npm run build && npx cap sync ios && npx cap open ios
```

Xcode가 열립니다.

---

## 4. 서명(Signing) 설정 (최초 1회)

1. Xcode 왼쪽에서 최상단 **App** 프로젝트 클릭 → 가운데 **TARGETS → App** 선택.
2. **Signing & Capabilities** 탭으로 이동.
3. **Automatically manage signing** 체크.
4. **Team** 드롭다운에서 본인 애플 개발자 계정(팀)을 선택.
   - 계정이 안 보이면 Xcode → Settings → Accounts 에서 애플 ID로 로그인.
5. **Bundle Identifier**가 `com.dreamnote.app` 로 돼 있는지 확인.
   이미 다른 앱에서 쓴 적 있으면 `com.본인이름.dreamnote` 처럼 고유하게 바꾸세요.

---

## 5. 아이폰에서 실행 / 설치

1. 아이폰을 USB로 맥에 연결 (처음이면 폰에서 "이 컴퓨터를 신뢰" 선택).
2. Xcode 상단 기기 목록에서 연결된 아이폰 선택.
3. ▶(Run) 버튼 클릭 → 앱이 빌드되어 폰에 설치·실행됩니다.
4. 처음 실행 시 폰에서 **설정 → 일반 → VPN 및 기기 관리**로 들어가
   본인 개발자 앱을 **신뢰**해야 열립니다.

> 애플 개발자 계정($99 멤버십)이 있으면 7일 만료 없이 1년간 유지됩니다.

---

## 6. (선택) 앱스토어 출시까지

1. Xcode 상단 기기에서 **Any iOS Device** 선택.
2. 메뉴 **Product → Archive**.
3. Archive 창에서 **Distribute App → App Store Connect** 로 업로드.
4. https://appstoreconnect.apple.com 에서 앱 정보·스크린샷·개인정보 처리방침을
   채우고 심사 제출.

> 음성·데이터 저장처럼 권한을 쓰는 앱은 심사 시 사용 목적을 적어야 해요.
> 개인용으로만 쓸 거면 5번까지만 해도 충분합니다.

---

## 자주 막히는 곳

- **`pod install` 오류**: `cd ios/App && pod install` 을 직접 실행해보세요.
- **음성이 안 됨**: 2번 Info.plist 권한을 추가했는지, 폰에서 마이크 권한을 허용했는지 확인.
  안 되더라도 텍스트 입력은 항상 됩니다.
- **"Untrusted Developer"**: 5번 4단계(기기 관리에서 신뢰)를 하세요.
- **빌드 후 화면이 하얗게 뜸**: `npm run build` 를 먼저 했는지, `npx cap sync ios` 가
  끝났는지 확인하세요.

---

## 안드로이드 / iOS 공통 메모

- 코드는 한 벌이고, 플랫폼은 자동 감지됩니다(`Capacitor.isNativePlatform()`).
- 데이터 저장(Preferences), 백업 내보내기/가져오기, 오프라인 풀이, AI 복사는
  두 OS에서 동일하게 동작합니다.
- 디자인을 바꾸면 `npm run build` 후 `npx cap sync ios` (또는 `android`) 한 번만
  돌리면 양쪽에 반영됩니다.
