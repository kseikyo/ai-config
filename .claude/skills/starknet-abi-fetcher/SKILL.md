---
name: starknet-abi-fetcher
description: Fetch contract ABIs from Starknet mainnet/testnet and generate TypeScript files. Use when you need to get the ABI for a deployed Starknet contract by address.
triggers:
  - "fetch ABI"
  - "get contract ABI"
  - "starknet contract"
  - "contract address"
  - "ABI from address"
---

# Starknet ABI Fetcher Skill

Fetch the ABI of any deployed Starknet contract and generate TypeScript files.

## Prerequisites

- `starkli` CLI installed (`~/.starkli/bin/starkli`)
- `bun` installed (for `bunx`)

## Quick Command (Recommended)

One command to fetch ABI and generate TypeScript:

```bash
starkli class-at "CONTRACT_ADDRESS" --rpc https://rpc.starknet.lava.build | \
  bunx abi-wan-kanabi --input /dev/stdin --output ./abi.ts
```

## Verified Working RPC Endpoints (Free)

| Provider | URL | Speed |
|----------|-----|-------|
| **Lava** (recommended) | `https://rpc.starknet.lava.build` | ~900ms |
| **dRPC** | `https://starknet.drpc.org` | ~1300ms |
| **ZAN** | `https://api.zan.top/public/starknet-mainnet` | ~4600ms |

## Examples

### Fetch Estimator Contract ABI

```bash
starkli class-at "0x077492b0ee941ec8aa24688051ff5443e81ffa11243365554c09344db0f8b071" \
  --rpc https://rpc.starknet.lava.build | \
  bunx abi-wan-kanabi --input /dev/stdin --output ./src/constants/abis/types/estimator.ts
```

### Fetch Ekubo Core Contract ABI

```bash
starkli class-at "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b" \
  --rpc https://rpc.starknet.lava.build | \
  bunx abi-wan-kanabi --input /dev/stdin --output ./ekubo-core-abi.ts
```

### Alternative: Use pnpm dlx

If `bunx` is not available:

```bash
starkli class-at "CONTRACT_ADDRESS" --rpc https://rpc.starknet.lava.build | \
  pnpm dlx abi-wan-kanabi --input /dev/stdin --output ./abi.ts
```

## Output Format

The generated TypeScript file will contain:

```typescript
export const ABI = [
  {
    "type": "impl",
    "name": "ContractImpl",
    "interface_name": "..."
  },
  // ... more ABI entries
] as const;
```

## Usage with starknet.js

```typescript
import { Contract, RpcProvider } from 'starknet';
import { ABI } from './abi';

const provider = new RpcProvider({ nodeUrl: 'https://rpc.starknet.lava.build' });
const contract = new Contract(ABI, CONTRACT_ADDRESS, provider).typedv2(ABI);

// Full type safety and autocomplete
const result = await contract.your_function_name(arg1, arg2);
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| `starkli: command not found` | Install via `curl https://get.starkli.sh \| sh` |
| `bunx: command not found` | Install bun via `curl -fsSL https://bun.sh/install \| bash` |
| `fetch failed` / timeout | Try a different RPC endpoint |
| `Contract not found` | Verify address is correct and deployed on mainnet |

## Environment Variable (Optional)

Set default RPC to avoid `--rpc` flag:

```bash
export STARKNET_RPC=https://rpc.starknet.lava.build
starkli class-at "CONTRACT_ADDRESS" | bunx abi-wan-kanabi -i /dev/stdin -o ./abi.ts
```
