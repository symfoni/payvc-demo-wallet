import ProjectInfoCard from "@/components/ProjectInfoCard";
import RequesDetailsCard from "@/components/RequestDetalilsCard";
import RequestMethodCard from "@/components/RequestMethodCard";
import RequestModalContainer from "@/components/RequestModalContainer";
import ModalStore from "@/store/ModalStore";
import { approveEIP155Request, rejectEIP155Request } from "@/utils/EIP155RequestHandlerUtil";
import { signClient } from "@/utils/WalletConnectUtil";
import { Button, Col, Container, Divider, Modal, Row, Spacer, Text, Textarea } from "@nextui-org/react";
import { createTRPCProxyClient, httpBatchLink, httpLink } from "@trpc/client";
import { Fragment, useEffect, useState } from "react";
import type { AppRouter } from "../../../payvc-demo/src/server/routers/_app";
import superjson from "superjson";
import { VCVerifier } from "@symfoni/vc-tools";
import { Json } from "@polkadot/types";
import { useVcStore } from "../store/VcStore";
const PAY_VC_URL = "http://localhost:3000";

const trpcClient = createTRPCProxyClient<AppRouter>({
	links: [
		httpLink({
			url: `${PAY_VC_URL}/api/trpc`,
		}),
	],
	transformer: superjson,
});

const walletID = "0x777";

export default function SessionReceiveCredential() {
	const [result, setResult] = useState<Awaited<ReturnType<InstanceType<typeof VCVerifier>["verifyVP"]>>>();
	const { saveVC } = useVcStore();
	// Get request and wallet data from store
	const requestEvent = ModalStore.state.data?.requestEvent;
	const requestSession = ModalStore.state.data?.requestSession;

	// Ensure request and wallet are defined
	if (!requestEvent || !requestSession) {
		return <Text>Missing request data</Text>;
	}

	// Get required request data
	const { topic, params } = requestEvent;
	const { request, chainId } = params;

	// get requisitionID from params
	const jwt = request.params[0] as string;

	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			const verifier = await VCVerifier.init({
				chains: [
					{
						chainId: 5,
						default: true,
						provider: {
							url: "https://eth-goerli.g.alchemy.com/v2/MWv0hh54YO82ISYuwhzpQdn8BbwwheJt",
						},
					},
				],
				dbName: "TEST_DB",
				walletSecret: "0xc3c2ccfc2adec51ca4a441714f01db02095c0ea7450664cd00d3787a0d4e1839", // 0xdddD62cA4f31F34d9beE49B07717a920DCCEa949
			});
			const result = await verifier.verifyVC({
				credential: jwt,
				policies: {
					audience: false,
				},
			});
			console.log(result);
			if (subscribed) {
				setResult(result);
				// setRequisition(requisition);
				// setCredentialOffers(credentialOffersList);
			}
		};
		doAsync();
		return () => {
			subscribed = false;
		};
	}, [jwt]);

	// Handle approve action (logic varies based on request method)
	async function onApprove() {
		if (requestEvent) {
			if (result?.verified) {
				saveVC(result.verifiableCredential);
				await signClient.respond({
					topic,
					response: {
						jsonrpc: "2.0",
						id: requestEvent.id,
						result: true,
					},
				});
				ModalStore.close();
			}
		}
	}

	// Handle reject action
	async function onReject() {
		if (requestEvent) {
			const response = rejectEIP155Request(requestEvent);
			await signClient.respond({
				topic,
				response,
			});
			ModalStore.close();
		}
	}

	return (
		<Fragment>
			<RequestModalContainer title="Receive Credential">
				<ProjectInfoCard metadata={requestSession.peer.metadata} />

				<Divider y={2} />

				<Row>
					<Col>
						<Text h5>VC</Text>
						{result && (
							<>
								<Text color="$gray400">{`Verified: ${result.verified ? "Yes" : "No"}`}</Text>
								{result.verifiableCredential?.credentialSubject &&
									Object.entries(result.verifiableCredential?.credentialSubject).map(([key, value]) => (
										<Row key={key}>
											<Col>
												<Text>{key}</Text>
											</Col>
											<Col>
												<Text>{value as string}</Text>
											</Col>
										</Row>
									))}
							</>
						)}
						<Spacer></Spacer>
					</Col>
				</Row>

				<Spacer></Spacer>
				<RequestMethodCard methods={[request.method]} />
			</RequestModalContainer>

			<Modal.Footer>
				<Button auto flat color="error" onClick={onReject}>
					Reject
				</Button>
				<Button auto flat color="success" onClick={onApprove}>
					Approve
				</Button>
			</Modal.Footer>
		</Fragment>
	);
}
