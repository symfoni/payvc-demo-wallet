import ProjectInfoCard from "@/components/ProjectInfoCard";
import RequesDetailsCard from "@/components/RequestDetalilsCard";
import RequestMethodCard from "@/components/RequestMethodCard";
import RequestModalContainer from "@/components/RequestModalContainer";
import ModalStore from "@/store/ModalStore";
import { approveEIP155Request, rejectEIP155Request } from "@/utils/EIP155RequestHandlerUtil";
import { signClient } from "@/utils/WalletConnectUtil";
import { Button, Card, Col, Container, Divider, Modal, Row, Spacer, Text } from "@nextui-org/react";

import { Fragment, useEffect, useState } from "react";
import { useVcStore } from "../store/VcStore";
import { checkPayVC, trpcClient } from "../utils/trpc";
import { VerifiableCredential } from "@veramo/core";

const walletID = "0x777";

export default function SessionPresentCredential() {
	const { vcs } = useVcStore();

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
	const credentialType = request.params[0] as string;
	const matchedCredentials = vcs.filter((vc) => vc.type?.includes(credentialType));
	const [selectedCredentail, setSelectedCredentail] = useState<VerifiableCredential>();

	// Handle approve action (logic varies based on request method)
	async function onApprove() {
		if (requestEvent) {
			if (selectedCredentail) {
				console.log("Sending", selectedCredentail);
				// const response = await approveEIP155Request(requestEvent);
				await signClient.respond({
					topic,
					response: {
						id: requestEvent.id,
						jsonrpc: "2.0",
						result: [selectedCredentail.proof.jwt],
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
			<RequestModalContainer title="Present Credential">
				<ProjectInfoCard metadata={requestSession.peer.metadata} />

				<Divider y={2} />

				<Row>
					<Col>
						<Text h5>Your credentials</Text>
						<Spacer></Spacer>
						{matchedCredentials.length === 0 && <Text>No credentials matching</Text>}
						{matchedCredentials?.map((vc) => (
							<Card bordered hoverable key={vc.id} onClick={() => setSelectedCredentail(vc)}>
								<Card.Body>
									<Text h5>{Array.isArray(vc.type) ? vc.type.join(", ") : vc.type}</Text>
									<Text color="$gray400">Data:</Text>
									{Object.entries(vc.credentialSubject).map(([key, value]) => (
										<Row key={key}>
											<Col>
												<Text color="$gray400">{key}</Text>
											</Col>
											<Col>
												<Text color="$gray400">{value as string}</Text>
											</Col>
										</Row>
									))}
								</Card.Body>
								<Card.Footer>
									<Button auto onPress={() => setSelectedCredentail(vc)}>
										Select
									</Button>
								</Card.Footer>
							</Card>
						))}
					</Col>
				</Row>

				<Spacer></Spacer>
				<RequestMethodCard methods={[request.method]} />
			</RequestModalContainer>

			<Modal.Footer>
				<Button auto flat color="error" onClick={onReject}>
					Reject
				</Button>
				<Button auto flat color="success" onClick={onApprove} disabled={!selectedCredentail}>
					{selectedCredentail ? "Approve" : "Select a credential first"}
				</Button>
			</Modal.Footer>
		</Fragment>
	);
}
