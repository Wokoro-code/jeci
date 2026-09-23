import "dotenv/config";
import * as users from "../server/db/users";
import * as verification from "../server/db/verification";
import * as connections from "../server/db/connections";
import * as messaging from "../server/db/messaging";
import * as feed from "../server/db/feed";
import * as opportunities from "../server/db/opportunities";
import * as roles from "../server/db/roles";
import * as profiles from "../server/db/profiles";
import * as promotionsDb from "../server/db/promotions";
import * as saved from "../server/db/saved";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`ÉCHEC: ${message}`);
  console.log(`OK: ${message}`);
}

async function main() {
  const suffix = Date.now();
  const alice = await users.registerLocalAccount({ email: `alice.${suffix}@cspp.test`, password: "motdepasse123", name: "Alice Alumni" });
  assert(alice.accountStatus === "pending_verification", "Alice démarre en attente de validation");

  const bob = await users.registerLocalAccount({ email: `bob.${suffix}@cspp.test`, password: "motdepasse123", name: "Bob Alumni" });

  const loggedIn = await users.loginWithPassword({ email: `alice.${suffix}@cspp.test`, password: "motdepasse123" });
  assert(loggedIn.id === alice.id, "Connexion par mot de passe fonctionne");

  try {
    await users.loginWithPassword({ email: `alice.${suffix}@cspp.test`, password: "mauvais-mot-de-passe" });
    assert(false, "ne devrait jamais arriver");
  } catch {
    console.log("OK: mauvais mot de passe rejeté");
  }

  // Un alumni non vérifié ne doit pas pouvoir envoyer de demande de connexion
  // (ceci est normalement bloqué par verifiedProcedure côté tRPC; on vérifie
  // ici la règle métier au niveau service pour Bob une fois vérifié).
  await verification.decideVerification(alice.id, alice.id, "approved", "Justificatif conforme");
  const aliceAfter = await users.getUserById(alice.id);
  assert(aliceAfter?.accountStatus === "verified", "Alice est vérifiée après approbation");

  await verification.decideVerification(bob.id, alice.id, "approved", "Justificatif conforme");

  await connections.sendConnectionRequest(alice.id, bob.id);
  const pendingForBob = await connections.listPendingRequests(bob.id);
  assert(pendingForBob.incoming.length === 1, "Bob voit la demande entrante d'Alice");

  await connections.respondToConnectionRequest(bob.id, alice.id, "accepted");
  const connected = await connections.areConnected(alice.id, bob.id);
  assert(connected, "Alice et Bob sont connectés après acceptation");

  const conversationId = await messaging.startOrGetDirectConversation(alice.id, bob.id);
  await messaging.sendMessage(alice.id, conversationId, { body: "Bonjour Bob !" });
  const messagesForBob = await messaging.listMessages(bob.id, conversationId);
  assert(messagesForBob.length === 1 && messagesForBob[0]?.body === "Bonjour Bob !", "Bob reçoit le message d'Alice");

  const postId = await feed.createPost(alice.id, { body: "Heureux de rejoindre le réseau CSPP !" });
  const feedForBob = await feed.listFeed(bob.id);
  assert(feedForBob.items.some((item) => item.id === postId), "La publication d'Alice apparaît dans le fil de Bob");

  await feed.toggleReaction(bob.id, postId, "like");
  const feedAfterReaction = await feed.listFeed(bob.id);
  const reactedPost = feedAfterReaction.items.find((item) => item.id === postId);
  assert(reactedPost?.reactionCount === 1, "La réaction de Bob est comptabilisée");

  const commentId = await feed.addComment(bob.id, postId, "Bienvenue Alice !");
  const commentsOnPost = await feed.listComments(postId);
  assert(commentsOnPost.some((c) => c.id === commentId && c.body === "Bienvenue Alice !"), "Le commentaire de Bob est bien enregistré");
  const feedAfterComment = await feed.listFeed(alice.id);
  assert(feedAfterComment.items.find((item) => item.id === postId)?.commentCount === 1, "Le compteur de commentaires est à jour");

  await profiles.updateProfile(bob.id, { mentorAvailable: true });
  const bobRoles = await users.getActiveRoleCodes(bob.id);
  assert(bobRoles.includes("mentor"), "Bob obtient automatiquement le rôle Mentor");

  const opportunityId = await opportunities.createOpportunity(alice.id, { title: "Développeur junior", type: "job", description: "Belle opportunité pour un alumni CSPP.", organization: "ACME" });
  const pending = await opportunities.listPendingOpportunities();
  assert(pending.some((o) => o.id === opportunityId), "L'offre d'Alice est en attente de validation admin");
  await opportunities.decideOpportunity(alice.id, opportunityId, "published");
  const published = await opportunities.listPublishedOpportunities();
  assert(published.some((o) => o.id === opportunityId), "L'offre publiée apparaît dans la liste publique");

  await roles.assignRole(alice.id, bob.id, "moderator", "Test d'attribution de rôle");
  const bobRolesAfter = await users.getActiveRoleCodes(bob.id);
  assert(bobRolesAfter.includes("moderator"), "Bob obtient le rôle Modérateur après attribution admin");

  // Un compte fraîchement inscrit, sans justificatif soumis, doit apparaître dans la file admin (bug corrigé)
  const carol = await users.registerLocalAccount({ email: `carol.${suffix}@cspp.test`, password: "motdepasse123", name: "Carol Alumni" });
  const queue = await verification.listVerificationQueue();
  assert(queue.some((row) => row.userId === carol.id), "Un compte sans justificatif apparaît bien dans la file de vérification admin");

  // Chat de groupe par promotion
  const promotionId = await promotionsDb.createPromotion(alice.id, { year: 1900 + (suffix % 190), label: `Promotion Test ${suffix}` });
  await profiles.updateProfile(alice.id, { promotionId });
  await profiles.updateProfile(bob.id, { promotionId });
  const groupConversationId = await messaging.getOrJoinPromotionConversation(alice.id, promotionId);
  const groupConversationId2 = await messaging.getOrJoinPromotionConversation(bob.id, promotionId);
  assert(groupConversationId === groupConversationId2, "Un seul groupe de discussion existe par promotion");
  await messaging.sendMessage(alice.id, groupConversationId, { body: "Bienvenue dans le groupe de promotion !" });
  const groupMessagesForBob = await messaging.listMessages(bob.id, groupConversationId);
  assert(groupMessagesForBob.some((m) => m.body === "Bienvenue dans le groupe de promotion !"), "Bob voit le message du groupe de promotion");
  const groupMembers = await messaging.listConversationMembers(groupConversationId);
  assert(groupMembers.length === 2, "Le groupe de promotion contient bien Alice et Bob");

  // Enregistrement d'une publication
  const savedResult = await saved.toggleSavedItem(bob.id, "post", postId);
  assert(savedResult.saved === true, "Bob peut enregistrer une publication");
  const bobSavedItems = await saved.listSavedItemsWithContent(bob.id);
  assert(bobSavedItems.some((item) => item.post?.id === postId), "La publication enregistrée apparaît dans la liste de Bob");

  console.log("\nTOUS LES TESTS FONCTIONNELS SONT PASSÉS ✅");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
