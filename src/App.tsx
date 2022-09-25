import React, {useState, useEffect} from 'react';
import './App.css';
import {WagmiConfig, createClient} from 'wagmi'
import {getDefaultProvider} from 'ethers'
import {ConnectKitProvider, ConnectKitButton, getDefaultClient} from "connectkit";

// Profile imports
import {
    useAccount,
    useConnect,
    useDisconnect,
    usePrepareContractWrite,
    useContractWrite,
    useWaitForTransaction,
    useBalance,
    chain,
    configureChains,
    allChains,
    defaultChains,
} from 'wagmi'
import {InjectedConnector} from 'wagmi/connectors/injected'
import {publicProvider} from 'wagmi/providers/public'
import {useNetwork} from 'wagmi'

const tokenAddress = '0xa250082378952006E616c74930a91f39e602D1a5'

const {provider} = configureChains(allChains, [publicProvider()])

const CrossChainIds = {
    goerliDomainId: 1735353714,
    optimismGoerliDomainId: 1735356532,
    mumbaiDomainId: 9991,
}

const client = createClient({
    autoConnect: true,
    provider,
})

function App() {
    return (
        <WagmiConfig client={client}>
            <ConnectKitProvider>
                <Profile/>
                <Body/>
                <Footer/>
            </ConnectKitProvider>
        </WagmiConfig>
    )
}

// Profile
function Profile() {
    const {address, isConnected} = useAccount()
    const {connect} = useConnect({
        connector: new InjectedConnector(),
    })
    const {disconnect} = useDisconnect()

    if (isConnected)
        return (
            <React.Fragment>
                <ConnectKitButton/>
            </React.Fragment>

        )
    return <button onClick={() => connect()}>Connect Wallet</button>
}

function Body() {

    const {address, connector, isConnected, status} = useAccount()
    const {connect, connectors, error, isLoading, pendingConnector} = useConnect()

    return (
        <div className="container">
            <div className="row">
                <div className="col-sm-12"><h1>Vaultemore</h1></div>
            </div>
            <div className="row">
                <div className="col-sm-12">This is a demonstration of a cross chain transfer of our vault token</div>
            </div>
            <div className="row">
                <div className="col-sm-12"><br/></div>
            </div>
            <div className="row">
                <div className="col-sm-12"><Chain/></div>
            </div>
            <div className="row">
                <div className="col-sm-12"><br/></div>
            </div>
            <div className="row">
                <div className="col-sm-12"><Balance/></div>
            </div>
            <div className="row">
                <div className="col-sm-12"><br/></div>
            </div>
            <div className="row">
                <div className="col-sm-2">First grab some tokens</div>
                <div className="col-sm-10"><Faucet/></div>
            </div>
            <div className="row">
                <div className="col-sm-12"><br/></div>
            </div>
            <div className="row">
                <div className="col-sm-2">Transfer tokens cross chain</div>
                <div className="col-sm-10"><CrossChainTransfer/></div>
            </div>
        </div>
    )
}

function Footer() {
    return (
        <footer className="sticky">
            <p>...</p>
        </footer>
    )
}

export default App;

function Chain() {
    const {chain, chains} = useNetwork()

    return (
        <div>
            {chain && <div>Connected to {chain.name}</div>}
            {chains && (
                <div>Available chains: {chains.map((chain) => chain.name)}</div>
            )}
        </div>
    )
}

function Balance() {
    const {address} = useAccount()
    const {chain} = useNetwork()

    const {data, isError, isLoading} = useBalance({
        addressOrName: address,
        token: tokenAddress,
    })

    if (isLoading) return <div>Fetching balance…</div>
    if (isError) return <div>Error fetching balance</div>
    return (
        <div>
            {data?.formatted} {data?.symbol} {chain?.name}
        </div>
    )
}


function Faucet() {
    const {
        config,
        error: prepareError,
        isError: isPrepareError,
    } = usePrepareContractWrite({
        addressOrName: tokenAddress,
        contractInterface: ['function faucet()'],
        functionName: 'faucet',
    })
    const {data, error, isError, write} = useContractWrite(config)

    const {isLoading, isSuccess} = useWaitForTransaction({
        hash: data?.hash,
    })

    return (
        <React.Fragment>
            <button disabled={!write || isLoading} onClick={() => write?.()}>
                {isLoading ? 'Sending...' : 'Faucet'}
            </button>
            {isSuccess && (
                <div>
                    Successfully sent faucet tokens!
                    <div>
                        <a href={`https://etherscan.io/tx/${data?.hash}`}>Etherscan</a>
                    </div>
                </div>
            )}
            {(isPrepareError || isError) && (
                <div>Error: {(prepareError || error)?.message}</div>
            )}
        </React.Fragment>
    )
}

function CrossChainTransfer() {
    const [amount, setAmount] = useState('');
    console.log("amount", amount)
    const debouncedAmount = useDebounce(amount, 500)
    console.log("amount debounced", debouncedAmount)

    const {
        config,
        error: prepareError,
        isError: isPrepareError,
    } = usePrepareContractWrite({
        addressOrName: tokenAddress,
        contractInterface: ['function xChainMint(uint32 _destinationDomain, uint256 _amountToMint, bool _forceSlow)'],
        functionName: 'xChainMint',
        args: [CrossChainIds.optimismGoerliDomainId, parseFloat(debouncedAmount) * 10e8, false], // todo bigint overflow 10e18
        enabled: Boolean(debouncedAmount),
    })
    const {data, error, isError, write} = useContractWrite(config)
    const {isLoading, isSuccess} = useWaitForTransaction({
        hash: data?.hash,
    })

    return (
        <React.Fragment>
            <input type="text" defaultValue={0.1} placeholder="Amount" onChange={e => {console.log("amoutn", e.target.value); setAmount(e.target.value);}}/>
            <button disabled={!write || isLoading} onClick={() => write?.()}>
                {isLoading ? 'Sending cross chain...' : 'XTransfer'}
            </button>
            {isSuccess && (
                <div>
                    Successfully sent tokens cross chain!
                    <div>
                        <a href={`https://goerli.etherscan.io/tx/${data?.hash}`}>Etherscan</a>
                    </div>
                </div>
            )}
            {(isPrepareError || isError) && (
                <div>Error: {(prepareError || error)?.message}</div>
            )}
        </React.Fragment>
    )
}

function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}