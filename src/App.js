import React, { useState } from "react";
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";
import { Provider, Signer } from "@reef-defi/evm-provider";
import { WsProvider } from "@polkadot/rpc-provider";
import { Contract } from "ethers";
import DeployerContract from "./contracts/Deployer.json";
import CharTokenContract from "./contracts/CharToken.json";
import Uik from "@reef-defi/ui-kit";
import { faCoins, faPaperPlane, faArrowsRotate, faFingerprint } from "@fortawesome/free-solid-svg-icons";


const DeployerAbi = DeployerContract.abi;
const CharTokenAbi = CharTokenContract.abi;
const DeployerAddress = DeployerContract.address;

const URL = "wss://rpc-testnet.reefscan.com/ws";

function App() {
	const [signer, setSigner] = useState();
	const [isWalletConnected, setWalletConnected] = useState(false);
	const [tokenName, setTokenName] = useState("");
	const [tokenSymbol, setTokenSymbol] = useState("");
	const [tokenDesc, setTokenDesc] = useState("");
	const [tokenFee, setTokenFee] = useState(0);
	const [tokenPremint, setTokenPremint] = useState(0);
	const [allTokens, setAllTokens] = useState([]);
	const [launchalert, setLaunchAlert] = useState(false)
	const [recentlyLaunched, setRecentlyLaunched] = useState({ "fetched": false })
	const [didUlaunch, setDidUlaunch] = useState(false);
	const [laddr, setLaddr] = useState();
	const [addrTfr, setAddrTfr] = useState();
	const [amountTfr, setAmountTfr] = useState();
	const [isOpen, setOpen] = useState(false)
	const [balAdr, setbalAdr] = useState()
	const [A, setA] = useState()
	const [howManytokens, sethowManytokens] = useState()


	const checkExtension = async () => {
		let allInjected = await web3Enable("Reef");

		if (allInjected.length === 0) {
			return false;
		}

		let injected;
		if (allInjected[0] && allInjected[0].signer) {
			injected = allInjected[0].signer;
		}

		const evmProvider = new Provider({
			provider: new WsProvider(URL),
		});

		evmProvider.api.on("ready", async () => {
			const allAccounts = await web3Accounts();

			allAccounts[0] &&
				allAccounts[0].address &&
				setWalletConnected(true);

			console.log(allAccounts);

			const wallet = new Signer(
				evmProvider,
				allAccounts[0].address,
				injected
			);

			const deployerAddress = await wallet.getAddress();
			setA(deployerAddress);
			// Claim default account
			if (!(await wallet.isClaimed())) {
				console.log(
					"No claimed EVM account found -> claimed default EVM account: ",
					await wallet.getAddress()
				);
				await wallet.claimDefaultAccount();
			}

			setSigner(wallet);
		});
	};

	const checkSigner = async () => {
		if (!signer) {
			await checkExtension();
		}
		return true;
	};

	const getDeployerFunctions = async () => {
		await checkSigner();
		const deployerContract = new Contract(
			DeployerAddress,
			DeployerAbi,
			signer
		);
		const charTokenContract = new Contract(
			DeployerAddress,
			CharTokenAbi,
			signer
		);
		let result = await deployerContract;
		console.log("Deployer contract : ");
		console.log(result);
		result = await charTokenContract;
		console.log("Char Token contract : ");
		console.log(result);
	};

	const getTotalSupply = async () => {
		await checkSigner();

		const charTokenContract = new Contract(
			recentlyLaunched["address"],
			CharTokenAbi,
			signer
		);
		try {
			let result = await charTokenContract.totalSupply();
			return result;
		} catch (error) {
			alert("Some error encountered");
		}
	}

	const sendAmount = async () => {
		await checkSigner();

		const charTokenContract = new Contract(
			recentlyLaunched["address"],
			CharTokenAbi,
			signer
		);
		try {
			let result = await charTokenContract.transfer(addrTfr, amountTfr);
			console.log(result);
			alert("Successfully sent " + amountTfr + " to " + addrTfr);
			let r = await getTotalSupply();
			sethowManytokens("Total Supply : " + r.toNumber());
		} catch (error) {
			alert("Some error encountered");
		}
	};

	const balanceOf = async (givenAddr) => {
		await checkSigner();

		const charTokenContract = new Contract(
			recentlyLaunched["address"],
			CharTokenAbi,
			signer
		);
		try {
			let result = await charTokenContract.balanceOf(givenAddr);
			console.log(result);
			alert(recentlyLaunched['name'] + " has " + result.toNumber() + " tokens");
		} catch (error) {
			alert("Some error encountered");
		}
	}

	const launchAlert = () => {
		setLaunchAlert(true);
	}

	const deployNewContract = async () => {
		await checkSigner();
		const deployerContract = new Contract(
			DeployerAddress,
			DeployerAbi,
			signer
		);
		try {
			let result = await deployerContract.deployNewContract(tokenName, tokenSymbol, tokenFee, tokenPremint, tokenDesc);
			console.log(result);
			launchAlert();
			const delay = ms => new Promise(res => setTimeout(res, ms));
			await delay(3000);
			setLaunchAlert(false);

		} catch (error) {
			alert("Some error encountered");
		}
		setTokenDesc("");
		setTokenPremint("");
		setTokenFee("");
		setTokenSymbol("");
		setTokenName("");
		await getRecentlyLaunched();
		setLaddr(recentlyLaunched["address"]);
	};

	const deployedContracts = async (x) => {
		await checkSigner();
		const deployerContract = new Contract(
			DeployerAddress,
			DeployerAbi,
			signer
		);
		try {
			let result = await deployerContract.deployedContracts(x);
			console.log(result);
			return result;
		} catch (error) {
			alert("Some error encountered");
		}

	};

	const getRecentlyLaunched = async () => {
		await checkSigner();
		const deployerContract = new Contract(
			DeployerAddress,
			DeployerAbi,
			signer
		);
		try {
			let result = await deployerContract.id();
			let x = result.toNumber() - 1;
			let addr = await deployedContracts(x);
			const charTokenContract = new Contract(
				addr,
				CharTokenAbi,
				signer
			);
			let tempObj = {};
			let res = await charTokenContract.name();
			tempObj["name"] = res;
			res = await charTokenContract.symbol();
			tempObj["symbol"] = res;
			res = await charTokenContract.desc();
			tempObj["desc"] = res;
			res = await charTokenContract.totalSupply();
			tempObj["totalSupply"] = res.toNumber();
			tempObj["fetched"] = true;
			tempObj["address"] = addr;
			setRecentlyLaunched(tempObj);
			setDidUlaunch(true);

		} catch (error) {
			alert("Some error encountered");
		}
	}

	const getAllContracts = async () => {
		await checkSigner();
		const deployerContract = new Contract(
			DeployerAddress,
			DeployerAbi,
			signer
		);
		try {
			let result = await deployerContract.id();
			let x = result.toNumber();
			let tempAllTokens = [];
			while (x--) {
				tempAllTokens.push(deployedContracts(x));
			}
			setAllTokens(tempAllTokens);

		} catch (error) {
			alert("Some error encountered");
		}

	};

	return (
		<Uik.Container className="main">
			<Uik.Container vertical>
				
				<Uik.Container>
					
					<Uik.ReefLogo /> <Uik.Text text="Deflationary" type="headline" />
					<Uik.Text text="LaunchPad" type="headline" />
				</Uik.Container>
				{isWalletConnected ? (
					<Uik.Container>

						<Uik.Card title='Launch your token' titlePosition='center'>
							<Uik.Container vertical className="container">
								{launchalert ? (
									<Uik.Alert
										type='success'
										text='Successfully Launched a new token!'
									/>
								) : ("")}
								<Uik.Input
									label='Token Name'
									value={tokenName}
									onInput={e => setTokenName(e.target.value)}
									required
								/>
								<Uik.Input
									label='Token Symbol'
									value={tokenSymbol}
									onInput={e => setTokenSymbol(e.target.value)}
									required
								/>

								<Uik.Input
									label='Fee'
									value={tokenFee}
									onInput={e => setTokenFee(e.target.value)}
									required
								/>
								<Uik.Input
									label='Premint'
									value={tokenPremint}
									onInput={e => setTokenPremint(e.target.value)}
									required
								/>
								<Uik.Input
									label='Token Description'
									value={tokenDesc}
									onInput={e => setTokenDesc(e.target.value)}
									required
								/>

								<Uik.Button
									onClick={deployNewContract}
									text="Launch Deflationary Token"
								/>



							</Uik.Container>
						</Uik.Card>
						<Uik.Container vertical>

							<Uik.Card title='Recently Launched' titlePosition='center'>
								<Uik.Container vertical>
									{!recentlyLaunched["fetched"] ? (
										<Uik.Button
											onClick={getRecentlyLaunched}
											icon={faArrowsRotate} size='large'
										/>

									) : (

										<Uik.Container flow='stretch'>

											<Uik.ReefSign />
											<Uik.Container vertical>
												<Uik.Text text={recentlyLaunched["name"]} type='light' />
												<Uik.Text text={recentlyLaunched["symbol"]} type='light' className="py-0" />
											</Uik.Container>
											<Uik.Container vertical>
												<Uik.Text text='Total Supply' type='mini' />
												<Uik.Tag color="purple" text={recentlyLaunched["totalSupply"]} />
											</Uik.Container>
										</Uik.Container>
									)}

								</Uik.Container>
							</Uik.Card>
							<Uik.Card title='Token Simulator' titlePosition='center'>
								<Uik.Container vertical>
									{didUlaunch ? (
										<>
											<Uik.Modal
												title={recentlyLaunched["name"]}
												isOpen={isOpen}
												onClose={() => setOpen(false)}
												onOpened={() => { }}
												onClosed={() => { }}
												footer={
													<>
														<Uik.Button text='Close' onClick={() => setOpen(false)} />
														<Uik.Button text='Confirm' fill onClick={() => setOpen(false)} />
													</>
												}
											>

												<Uik.Text text={recentlyLaunched["desc"]} type='light' />
												<br />
												<Uik.Container vertical>
													<Uik.Container flow='stretch'>
														<Uik.Button text='Your Balance' onClick={() => console.log(A)} />
														<Uik.Input
															value={balAdr}
															onInput={e => setbalAdr(e.target.value)}
														/>
														<Uik.Button text='Fetch Balance' onClick={() => balanceOf(balAdr)} />
													</Uik.Container>
													<Uik.Divider text='Transfer Deflationary Tokens' />
													<Uik.Container flow='stretch'>
														<Uik.Input label='Transfer to (address)'
															value={addrTfr}
															onInput={e => setAddrTfr(e.target.value)}
														/>
														<Uik.Input
															label='amount (uint)'
															value={amountTfr}
															onInput={e => setAmountTfr(e.target.value)}
														/>

													</Uik.Container>
													<Uik.Button text='Send' onClick={sendAmount} />
												</Uik.Container>
												<Uik.Divider text={howManytokens} />
											</Uik.Modal>
											<Uik.Button text='Launch Simulator' onClick={() => setOpen(true)} />
											<Uik.Button
												onClick={getAllContracts}
												text="Get all contracts"
											/>
											<Uik.Button
												onClick={getDeployerFunctions}
												text="Get Deployer Functions"
											/>
										</>
									) : (
										<Uik.Text text='You need to launch a token to simulate it`s behaviour. Fill the form at left & you will be able to simulate the token.' type='light' />
									)}

								</Uik.Container>
							</Uik.Card>
						</Uik.Container>
					</Uik.Container>
				) : (
					<>
						<br />
						<Uik.Container vertical className="container">

							<Uik.Text text='Introduction' type='lead' />
							<Uik.Text text="It's a launchpad for deflationary tokens on REEF . A deflationary token is the token which experiences deflation rather than inflation, i.e over time, it becomes more valuable unlike most of the currencies out there.
" type='light' />
							<Uik.Button
								onClick={checkExtension}
								text="Connect Wallet"
							/>

							<Uik.Text text='Features of dApp' type='lead' />
							<Uik.Text text="User can launch a deflationary token without any coding knowledge.
" type='light' />
							<Uik.Text text="After launching the token, user will have all the preminted amount of token & can send it to anyone.
" type='light' />
							<Uik.Text text="Total Supply will be reduced after each transaction because some amount of tokens will be burnt after transaction.
" type='light' />
							<Uik.Text text="Pro users can utilise it more by copying the address and fetching the deployed contract from address on the Remix IDE.
" type='light' />

							<br />
							<Uik.Text text='How to use this dApp?' type='lead' />

							<Uik.Text text="This dApp is divided into 3 sections and each of them has different utility.
" type='light' />
							<Uik.Container>
								<Uik.Tag text="Launch your token" /><Uik.Text text="Fill all the details of token & it will be launched.  
" type='light' />
							</Uik.Container>
							<Uik.Container>
								<Uik.Tag text="Recently Launched" /><Uik.Text text="Shows the most recent deployed token on Reef Chain.
" type='light' />
							</Uik.Container>
							<Uik.Container>
								<Uik.Tag text="Token Simulator" /><Uik.Text text="Click on it to simulate the behaviour of token by sending tokens to any address.
" type='light' />
							</Uik.Container>
							<br />
							<Uik.Text text="Read more about this project 
" type='light' />
<a href="https://github.com/anukulpandey/reef-deflationary-token-launchpad">here</a>
							<br />
						</Uik.Container>
					</>


				)}
			</Uik.Container>
		</Uik.Container>
	);
}

export default App;
