# Proofolio — 위변조가 불가능한 디지털 증명서 플랫폼

학력·수료증 같은 증명서를 블록체인에 발급해, **누구나 지갑 없이 진위를 검증**할 수 있는 dApp입니다.
파일이 한 글자만 바뀌어도 위조로 잡아내고, "어느 기관이 발급했는지"까지 확인할 수 있습니다.

- 🔗 **데모** — https://proofolio.pages.dev
- 📜 **검증된 컨트랙트** — [Sepolia Etherscan에서 보기](https://sepolia.etherscan.io/address/0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2#code)
- 📑 **발표 자료** — [Proofolio_presentation.pptx](docs/Proofolio_presentation.pptx)

### 위변조 탐지 예시

| 원본 파일 업로드 → **일치 ✅** | 변조된 파일 업로드 → **위변조 ❌** |
|:---:|:---:|
| ![원본 파일](docs/demo-original.png) | ![변조 파일](docs/demo-tampered.png) |

---

## 왜 만들었나

가짜 이력서와 위조된 수료증은 매년 반복되는 문제입니다.
지금은 채용 담당자가 제출된 PDF를 그냥 믿거나, 발급 기관에 일일이 전화해 확인하는 수밖에 없습니다.
단순 데이터베이스로 만들어도 결국 **그 DB 운영자를 믿어야 한다는 한계**가 남습니다.

**Proofolio의 핵심은 한 문장입니다 — "PDF 파일이 아니라, 발급기관이 블록체인에 남긴 서명을 믿는다."**
운영자조차 기록을 바꿀 수 없고, 누구든 직접 검증할 수 있습니다.

## 어떻게 동작하나

| 원리 | 역할 |
|------|------|
| **파일 해시 (keccak256)** | 원본 파일마다 고유 번호를 만들어 발급 시 블록체인에 저장. 검증 시 다시 대조해 위변조 탐지 |
| **지갑 주소 = 신원** | 발급기관의 지갑 주소 자체가 도장. 등록된 기관만 자기 이름으로 발급 가능 |

→ 결국 **"등록된 기관이, 바로 이 원본 파일을 발급했다"** 는 사실이 수학적으로 증명됩니다.

## 주요 기능

- **관리자** — 검증된 발급기관을 등록하고 활성/비활성 관리
- **발급기관** — 원본 파일을 브라우저에서 해싱해, 양도 불가능한(소울바운드) 증명서를 발급
- **보유자** — 받은 증명서 조회, 검증 링크 복사, QR 코드 생성
- **검증자** — 지갑 없이 `/verify/{tokenId}` 접속 → 발급기관·발급일·폐기 여부 확인, 원본 파일 업로드로 해시 대조

## 기술적으로 신경 쓴 점

- **소울바운드(양도 불가) 증명서** — `_update` 오버라이드로 발급(mint)만 허용, 증명서 매매·이전 차단
- **지갑 없이 검증 가능** — 읽기 전용 RPC를 서명자(MetaMask)와 분리해, 검증자는 지갑 없이도 진위 확인
- **온체인 SVG 메타데이터** — 별도 서버 없이 컨트랙트가 직접 토큰 이미지를 생성, 주입 방지를 위한 sanitize 처리
- **자동 테스트 17개** — 정상 동작뿐 아니라 권한 위반, 소울바운드 양도 차단 등 공격·엣지 케이스 검증
- **Etherscan 소스 검증 완료** — 사용자가 운영자를 믿지 않아도 컨트랙트 코드를 직접 확인 가능

## 한계와 보완

블록체인은 *"이 기관이 이 증명서를 발급했다"* 까지는 확실히 증명하지만, *"그 기관 자체가 믿을 만한가"* 는 보장하지 못합니다.
그래서 **관리자가 발급기관을 직접 검토·등록하는 절차**를 두어 이 부분을 보완했습니다.
(개인정보는 온체인에 영구·공개로 남으므로 `credType`이나 메타데이터에 저장하지 않습니다.)

## 기술 스택

- **블록체인:** Solidity 0.8.28, OpenZeppelin ERC-721, Ownable2Step, Hardhat, ethers v6
- **프론트엔드:** React 19, TypeScript, Tailwind CSS, Vite, MetaMask
- **네트워크 / 배포:** Ethereum Sepolia, Cloudflare Pages (Wrangler)

## 컨트랙트

- **Sepolia:** `0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2`
- **Etherscan:** https://sepolia.etherscan.io/address/0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2

## 빠른 검증 데모

1. https://proofolio.pages.dev/verify/2 접속
2. 발급에 사용된 **원본 파일** 업로드 → **원본 일치 ✅**
3. **다른 파일** 업로드 → **해시 불일치 · 위변조 의심 ❌**

## 로컬 실행

```bash
npm install
cp .env.example .env   # 아래 값 채우기

npm run dev            # 프론트엔드 개발 서버
npm test               # 스마트컨트랙트 테스트 (17개)
npm run compile        # 컨트랙트 컴파일
```

`.env`에 채울 값:

```bash
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
VITE_CONTRACT_ADDRESS=0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=          # 배포용 테스트넷 지갑 키 (절대 커밋 금지)
ETHERSCAN_API_KEY=
```

> `VITE_*` 값만 프론트엔드 번들에 포함됩니다. `.env`와 개인키는 절대 커밋하지 마세요.

## 배포

```bash
npm run deploy:sepolia    # Sepolia에 컨트랙트 배포
npm run pages:deploy      # Cloudflare Pages에 프론트엔드 배포
```

Etherscan 컨트랙트 검증:

```bash
npx hardhat verify --network sepolia 0x84b5e7F9BB2C87912528D4f63D9D9A7257475Cd2
```

> Cloudflare Pages 프로덕션 빌드 전에 `VITE_SEPOLIA_RPC_URL`, `VITE_CONTRACT_ADDRESS`(선택: `VITE_CONTRACT_DEPLOY_BLOCK`)를 환경 변수로 설정하세요.

---

⚠️ `PRIVATE_KEY`는 **Sepolia 테스트넷 전용 지갑**만 사용하세요. `.env`는 `.gitignore`에 포함돼 있습니다.
