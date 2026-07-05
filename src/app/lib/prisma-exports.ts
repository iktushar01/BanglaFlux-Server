import prismaPkg from "../../generated/prisma/index";

const prismaModule = prismaPkg as typeof import("../../generated/prisma/index");

export const PrismaClient = prismaModule.PrismaClient;
export const Prisma = prismaModule.Prisma;

export const Role = prismaModule.Role;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = prismaModule.UserStatus;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const Gender = prismaModule.Gender;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const ChannelCategory = prismaModule.ChannelCategory;
export type ChannelCategory = (typeof ChannelCategory)[keyof typeof ChannelCategory];

export const PlaylistSourceType = prismaModule.PlaylistSourceType;
export type PlaylistSourceType = (typeof PlaylistSourceType)[keyof typeof PlaylistSourceType];

