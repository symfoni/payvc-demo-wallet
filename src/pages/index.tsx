import AccountCard from "@/components/AccountCard";
import AccountPicker from "@/components/AccountPicker";
import PageHeader from "@/components/PageHeader";
import { COSMOS_MAINNET_CHAINS } from "@/data/COSMOSData";
import { EIP155_MAINNET_CHAINS, EIP155_TEST_CHAINS } from "@/data/EIP155Data";
import { SOLANA_MAINNET_CHAINS, SOLANA_TEST_CHAINS } from "@/data/SolanaData";
import { POLKADOT_MAINNET_CHAINS, POLKADOT_TEST_CHAINS } from "@/data/PolkadotData";
import { ELROND_MAINNET_CHAINS, ELROND_TEST_CHAINS } from "@/data/ElrondData";
import SettingsStore from "@/store/SettingsStore";
import { Button, Card, Col, Container, Row, Spacer, Text } from "@nextui-org/react";
import { Fragment } from "react";
import { useSnapshot } from "valtio";
import { NEAR_TEST_CHAINS } from "@/data/NEARData";
import { useVcStore } from "../store/VcStore";
import { DEMO_VERIFIER_URL, PAY_VC_URL, trpcClient } from "../utils/trpc";

export default function HomePage() {
	const { testNets, eip155Address, cosmosAddress, solanaAddress, polkadotAddress, nearAddress, elrondAddress } =
		useSnapshot(SettingsStore.state);
	const { transactions, vcs, removeTransaction } = useVcStore();
	console.log(vcs);

	// async function presentCredential(transactionId: string) {
	// 	const fullfilled = await trpcClient.transaction.fullfill.mutate({ transactionId });
	// 	if (fullfilled) {
	// 		removeTransaction(transactionId);
	// 	}
	// }
	return (
		<Fragment>
			<PageHeader title="Accounts">
				<AccountPicker />
			</PageHeader>
			<Text h4 css={{ marginBottom: "$5" }}>
				On-going credential processes
			</Text>
			{transactions.map((transaction) => {
				const requiresParent = transaction.credentialOffer?.parentRequirement;
				const hasParentVC = requiresParent
					? vcs.find((vc) => vc.type?.includes(requiresParent?.credentialType.name))
					: undefined;
				const hasPrimaryVC = transaction.credentialOffer
					? vcs.find((vc) => vc.type?.includes(transaction.requsition?.credentialType.name))
					: undefined;
				return (
					<Card hoverable bordered key={transaction.id}>
						<Card.Header>
							<Text
								h6
							>{`${transaction.requsition.verifier.name} request ${transaction.requsition.credentialType.name}`}</Text>
						</Card.Header>
						<Card.Body>
							<Row>
								<Col>Created</Col>
								<Col>
									<Text>
										{typeof transaction.createdAt === "string"
											? transaction.createdAt
											: transaction.createdAt.toDateString()}
									</Text>
								</Col>
							</Row>
							<Row>
								<Col>Requires</Col>
								<Col>
									{[requiresParent?.credentialType.name, transaction.credentialOffer?.credentialType.name].join(", ")}
								</Col>
							</Row>
							<Spacer></Spacer>
							{requiresParent && (
								<>
									<Button
										as="a"
										href={`${PAY_VC_URL}/issuer-service/${requiresParent?.issuer.slug}`}
										target="_blank"
										auto
										disabled={!!hasParentVC}
									>{`Get ${requiresParent?.credentialType.name}`}</Button>
									<Spacer></Spacer>
								</>
							)}
							<Button
								as="a"
								href={`${PAY_VC_URL}/issuer-service/${transaction.credentialOffer?.issuer.slug}`}
								target="_blank"
								disabled={!!hasPrimaryVC}
							>{`Get ${transaction.credentialOffer?.credentialType.name}`}</Button>
							<Spacer></Spacer>
							<Button as="a" target="_blank" href={`${DEMO_VERIFIER_URL}`} disabled={!hasPrimaryVC} color={"success"}>
								{`Present credential to ${transaction.requsition.verifier.name}`}
							</Button>
							<Spacer></Spacer>
							<Button color={"error"} onPress={() => removeTransaction(transaction.id)}>
								Delete credential request
							</Button>
						</Card.Body>
					</Card>
				);
			})}
			{transactions.length === 0 && (
				<Card>
					<Text>None</Text>
				</Card>
			)}
			<Spacer></Spacer>
			{/* <Text h4 css={{ marginBottom: '$5' }}>
        Mainnets
      </Text>
      {Object.values(EIP155_MAINNET_CHAINS).map(({ name, logo, rgb }) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={eip155Address} />
      ))}
      {Object.values(COSMOS_MAINNET_CHAINS).map(({ name, logo, rgb }) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={cosmosAddress} />
      ))}
      {Object.values(SOLANA_MAINNET_CHAINS).map(({ name, logo, rgb }) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={solanaAddress} />
      ))}
      {Object.values(POLKADOT_MAINNET_CHAINS).map(({ name, logo, rgb }) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={polkadotAddress} />
      ))}
      {Object.values(ELROND_MAINNET_CHAINS).map(({ name, logo, rgb }) => (
        <AccountCard key={name} name={name} logo={logo} rgb={rgb} address={elrondAddress} />
      ))} */}

			{/* {testNets ? ( */}
			<Fragment>
				{/* <Text h4 css={{ marginBottom: "$5" }}>
					Testnets
				</Text> */}
				{Object.values(EIP155_TEST_CHAINS).map(({ name, logo, rgb }) => (
					<AccountCard key={name} name={name} logo={logo} rgb={rgb} address={eip155Address} />
				))}
				{/* {Object.values(SOLANA_TEST_CHAINS).map(({ name, logo, rgb }) => (
						<AccountCard key={name} name={name} logo={logo} rgb={rgb} address={solanaAddress} />
					))}
					{Object.values(POLKADOT_TEST_CHAINS).map(({ name, logo, rgb }) => (
						<AccountCard key={name} name={name} logo={logo} rgb={rgb} address={polkadotAddress} />
					))}
					{Object.values(NEAR_TEST_CHAINS).map(({ name, logo, rgb }) => (
						<AccountCard key={name} name={name} logo={logo} rgb={rgb} address={nearAddress} />
					))}
					{Object.values(ELROND_TEST_CHAINS).map(({ name, logo, rgb }) => (
						<AccountCard key={name} name={name} logo={logo} rgb={rgb} address={elrondAddress} />
					))} */}
			</Fragment>
			{/* ) : null} */}
		</Fragment>
	);
}
