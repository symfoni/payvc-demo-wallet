import ProjectInfoCard from "@/components/ProjectInfoCard";
import RequesDetailsCard from "@/components/RequestDetalilsCard";
import RequestMethodCard from "@/components/RequestMethodCard";
import RequestModalContainer from "@/components/RequestModalContainer";
import ModalStore from "@/store/ModalStore";
import { approveEIP155Request, rejectEIP155Request } from "@/utils/EIP155RequestHandlerUtil";
import { signClient } from "@/utils/WalletConnectUtil";
import { Button, Col, Container, Divider, Modal, Row, Spacer, Text } from "@nextui-org/react";

import { Fragment, useEffect, useState } from "react";
import { useVcStore } from "../store/VcStore";
import { checkPayVC, trpcClient } from "../utils/trpc";

const walletID = "0x777";

export default function SessionRequestCredential() {
	const [credentialOffers, setCredentialOffers] =
		useState<Awaited<ReturnType<typeof trpcClient.credentialOffer.listBy.query>>>();
	const [requisition, setRequisition] = useState<Awaited<ReturnType<typeof trpcClient.requsition.get.query>>>();
	const [transaction, setTransaction] =
		useState<Awaited<ReturnType<typeof trpcClient.credentialOffer.selectIssuer.mutate>>>();
	// Get request and wallet data from store
	const { saveTransaction, transactions } = useVcStore();
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
	const requisitionId = request.params[0] as string;

	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			await checkPayVC();
			const requisition = await fetchRequisition(requisitionId);
			const credentialOffersList = await fetchCredentialOffers(requisitionId);
			if (subscribed) {
				setRequisition(requisition);
				setCredentialOffers(credentialOffersList);
			}
		};
		doAsync();
		return () => {
			subscribed = false;
			setCredentialOffers(undefined);
			setRequisition(undefined);
			setTransaction(undefined);
		};
	}, [requisitionId]);

	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			// await checkPayVC();
			// const requisition = await fetchRequisition(requisitionId);
			// const credentialOffersList = await fetchCredentialOffers(requisitionId);
			// if (subscribed) {
			// 	setRequisition(requisition);
			// 	setCredentialOffers(credentialOffersList);
			// }
		};
		doAsync();
		return () => {
			subscribed = false;
		};
	}, [transaction]);

	async function fetchRequisition(requisitionId: string) {
		console.log(requisitionId);
		const requisition = await trpcClient.requsition.get.query({ id: requisitionId });
		if (!requisition) {
			throw new Error("No credential offers found");
		}
		console.log("requisition", requisition);
		return requisition;
	}

	async function fetchCredentialOffers(requisitionId: string) {
		console.log(requisitionId);
		const credentialOffersList = await trpcClient.credentialOffer.listBy.query({ requsitionId: requisitionId });
		if (!credentialOffersList.items || credentialOffersList.items.length === 0) {
			throw new Error("No credential offers found");
		}
		console.log("credentialOffersList", credentialOffersList);
		return credentialOffersList;
	}
	async function selectCredentialOffer(requisitionId: string, credentialOfferId: string) {
		console.log(requisitionId);
		const transaction = await trpcClient.credentialOffer.selectIssuer.mutate({
			credentialOfferId,
			requsitionId: requisitionId,
			walletId: walletID,
		});
		console.log("transaction", transaction);
		setTransaction(transaction);
		return transaction;
	}

	// Handle approve action (logic varies based on request method)
	async function onApprove() {
		if (requestEvent) {
			if (transaction) {
				saveTransaction(transaction);
				// const response = await approveEIP155Request(requestEvent);
				await signClient.respond({
					topic,
					response: {
						id: requestEvent.id,
						jsonrpc: "2.0",
						result: [transaction.id],
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
						<Text h5>Requisition</Text>
						<Text color="$gray400">{`id: ${requisitionId}`}</Text>
						{requisition && <Text color="$gray400">{`Name: ${requisition.credentialType.name}`}</Text>}
						<Spacer></Spacer>
					</Col>
				</Row>

				<Divider y={2} />
				<Row>
					<Col>
						<Text h5>Credential Offers</Text>
						<Spacer></Spacer>
						{credentialOffers?.items.map((credentialOffer) => (
							<Row>
								<Col>
									<Container>
										<Text color="$gray400">Type: {credentialOffer.name}</Text>
										<Text color="$gray400">Issuer: {credentialOffer.issuer.name}</Text>
										{credentialOffer.parentRequirement && (
											<>
												<Text h6>Requirements</Text>
												<Text color="$gray400">Type: {credentialOffer.parentRequirement.credentialType.name}</Text>
												<Text color="$gray400">Issuer: {credentialOffer.parentRequirement.issuer.name}</Text>
											</>
										)}
										<Button size={"sm"} onPress={() => selectCredentialOffer(requisitionId, credentialOffer.id)}>
											Select credential offer
										</Button>
									</Container>
								</Col>
							</Row>
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
				<Button auto flat color="success" onClick={onApprove} disabled={!transaction}>
					{transaction ? "Approve" : "Select a credential offer first"}
				</Button>
			</Modal.Footer>
		</Fragment>
	);
}
