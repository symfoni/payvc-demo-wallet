import { VerifiableCredential } from "@veramo/core";
import create from "zustand";
import { persist } from "zustand/middleware";
import { trpcClient } from "../utils/trpc";

export type PayVCTransaction = Awaited<ReturnType<typeof trpcClient.credentialOffer.selectIssuer.mutate>>;

export interface GlobalState {
	transactions: PayVCTransaction[];
	vcs: VerifiableCredential[];
	secret?: string;
	setSecret: (secret: string) => void;
	saveTransaction: (transaction: PayVCTransaction) => void;
	saveVC: (vc: VerifiableCredential) => void;
	removeTransaction: (id: string) => void;
}
export const useVcStore = create<GlobalState>()(
	persist(
		(set) => ({
			secret: undefined,
			transactions: [],
			vcs: [],
			setSecret: (secret: string) => set((state) => ({ secret: secret })),
			saveTransaction: (transaction: PayVCTransaction) => {
				return set((state) => {
					return { transactions: [...state.transactions, transaction] };
				});
			},
			removeTransaction: (id: string) => {
				return set((state) => {
					return { transactions: state.transactions.filter((t) => t.id !== id) };
				});
			},
			saveVC: (vc: VerifiableCredential) => {
				return set((state) => {
					return { vcs: [...state.vcs, vc] };
				});
			},
		}),
		{
			name: "vc-store",
			partialize: (state) => ({ transactions: state.transactions, vcs: state.vcs, secret: state.secret }),
		},
	),
);
