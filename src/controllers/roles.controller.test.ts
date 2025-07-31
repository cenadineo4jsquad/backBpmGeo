import { getRoles } from "./roles.controller";
import { PrismaClient } from "@prisma/client";

// src/controllers/roles.controller.test.ts

jest.mock("@prisma/client");
const prismaMock = PrismaClient.prototype as any;

describe("getRoles", () => {
  let reply: any;

  beforeEach(() => {
    reply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  it("should return 401 if user is not present", async () => {
    const request = { user: undefined };
    await getRoles(request as any, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith({ error: "Non autorisé" });
  });

  it("should return 403 if user is not admin", async () => {
    const request = { user: { niveau_hierarchique: 2 } };
    await getRoles(request as any, reply);
    expect(reply.status).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({ error: "Réservé aux administrateurs" });
  });

  it("should return roles if user is admin", async () => {
    const rolesData = [{ id: 1, nom: "Admin", permissions: [] }];
    prismaMock.roles = {
      findMany: jest.fn().mockResolvedValue(rolesData),
    };
    const request = { user: { niveau_hierarchique: 4 } };
    await getRoles(request as any, reply);
    expect(prismaMock.roles.findMany).toHaveBeenCalledWith({ include: { permissions: true } });
    expect(reply.send).toHaveBeenCalledWith(rolesData);
  });

  it("should handle errors from prisma", async () => {
    prismaMock.roles = {
      findMany: jest.fn().mockRejectedValue(new Error("DB error")),
    };
    const request = { user: { niveau_hierarchique: 4 } };
    await getRoles(request as any, reply);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: "Erreur lors de la récupération des rôles" });
  });
});