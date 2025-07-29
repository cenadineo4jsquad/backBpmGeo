import { FastifyRequest, FastifyReply } from "fastify";

interface Role {
  nom: string;
}

interface UtilisateurRole {
  roles?: Role;
}

interface User {
  utilisateur_roles?: UtilisateurRole[];
}

export function restrictToAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
  done: () => void
): void {
  const user = (req as any).user as User | undefined;
  console.log("[restrictToAdmin] user:", JSON.stringify(user, null, 2));
  let isAdmin = false;
  if (user && user.utilisateur_roles && user.utilisateur_roles.length > 0) {
    isAdmin = user.utilisateur_roles.some(
      (ur) =>
        ur.roles &&
        (ur.roles.nom === "admin" || ur.roles.nom === "Administrateur système")
    );
  }
  if (isAdmin) {
    return done();
  }

  reply.code(403).send({ error: "Réservé aux administrateurs" });
}
