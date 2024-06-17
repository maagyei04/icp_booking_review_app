import { HttpAgent, Actor } from "@dfinity/agent";
import { getAuthClient } from "./auth.js"

const HOST = window.location.origin;

export async function createCanisterActor(canisterId, idl) {
    const authClient = await getAuthClient();
    const agent = new HttpAgent({
        host: HOST,
        identity: authClient.getIdentity()
    });
    await agent.fetchRootKey(); //
    return Actor.createActor(idl, {
        agent,
        canisterId,
    });
}
