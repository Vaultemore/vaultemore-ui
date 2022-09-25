import React from 'react';
import logo from './logo.svg';
import './App.css';
import { WagmiConfig, createClient } from 'wagmi'
import { getDefaultProvider } from 'ethers'
// Profile imports
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'


const client = createClient({
    autoConnect: true,
    provider: getDefaultProvider(),
})

function App() {
    return (
            <WagmiConfig client={client}>
                <Profile />
            </WagmiConfig>
            )
}

// Profile
function Profile() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect({
        connector: new InjectedConnector(),
    })
    const { disconnect } = useDisconnect()

    if (isConnected)
        return (
                <div>
                    Connected to {address}
                    <button onClick={() => disconnect()}>Disconnect</button>
                </div>
                )
    return <button onClick={() => connect()}>Connect Wallet</button>
}

export default App;
