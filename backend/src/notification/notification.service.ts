import { Injectable } from "@nestjs/common";
import { Notification, User } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import
{
	NotificationType,
	NotificationContentFunctions,
} from "./content-notification";

@Injectable()
export class NotificationService
{
	constructor(
		private prismaService: PrismaService,
	) {}

	async getNotificationsById(userId: number)
	{
		const notifications = await this.prismaService.notification.findMany({
			where: { userId: userId },
			orderBy: { id: 'desc' },
		});
		return notifications;
	}

	async getUnreadNotifications(userId: number): Promise<Notification[]>
	{
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: { notifications: true },
		});
		if (!user)
			throw new Error("User not found");

		const unreadNotifications = user.notifications.filter(
			(notification) => !notification.read
		);

		return (unreadNotifications);
	}

	async addNotificationByUserId(
		userId: number,
		notificationDto: CreateNotificationDto,
		notifType: number,
	)
	{
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: { notifications: true },
		});

		if (!user) throw new Error("User not found");

		const updatedContent = this.setContentInNotification(
			notifType,
			notificationDto
		);

		const notification = this.prismaService.notification.create({
			data: {
				user: {
					connect: {
						id: user.id,
					},
				},
				fromId: notificationDto.fromUserId,
				type: notifType,
				content: updatedContent,
			},
		});

		return notification;
	}

	setContentInNotification(
		notifType: number,
		notificationDto: CreateNotificationDto
	)
	{
		const contentGenerator =
			NotificationContentFunctions[notifType as NotificationType];

		if (
			notifType === NotificationType.FRIENDREQUEST_RECEIVED ||
			notifType === NotificationType.FRIENDREQUEST_ACCEPTED ||
			notifType === NotificationType.INVITED_TO_GAME
		)
		{
			if (!notificationDto.fromUser)
				throw new Error("Missing fromUser in notificationDto");
			const content = contentGenerator(notificationDto.fromUser);
			return content;
		} else if (notifType === NotificationType.ACHIEVEMENT_UNLOCKED)
		{
			if (!notificationDto.achievementName)
				throw new Error("Missing achievementName in notificationDto");
			const content = contentGenerator(notificationDto.achievementName);
			return content;
		} else if (
			notifType === NotificationType.INVITED_TO_CHANNEL ||
			notifType === NotificationType.INTEGRATED_TO_CHANNEL
		)
		{
			if (!notificationDto.fromUser)
				throw new Error("Missing fromUser in notificationDto");
			if (!notificationDto.channelName)
				throw new Error("Missing channelName in notificationDto");
			const content = contentGenerator(
				notificationDto.fromUser,
				notificationDto.channelName
			);
			return content;
		} else if (notifType === NotificationType.CHANNEL_PRIVILEGE_GRANTED)
		{
			if (!notificationDto.privilegeName)
				throw new Error("Missing privilegeName in notificationDto");
			if (!notificationDto.channelName)
				throw new Error("Missing channelName in notificationDto");
			const content = contentGenerator(
				notificationDto.privilegeName,
				notificationDto.channelName
			);
			return content;
		} else throw new Error("Invalid notification type");
	}

	async setNotificationReadById(userId: number, notificationId: number)
	{
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: { notifications: true },
		});

		if (!user)
			throw new Error("User not found");

		let updatedNotification = await this.prismaService.notification.findFirst({
			where: { id: notificationId },
		});

		updatedNotification = await this.prismaService.notification.update({
			where: { id: notificationId },
			data: { read: true },
		});

		this.deleteNotificationById(userId, notificationId);
		return updatedNotification;
	}

	// For test only, need to delete it after
	async getAllNotifications()
	{
		const notifications = await this.prismaService.notification.findMany();

		return notifications;
	}

	async updateNumber(notificationId: number, userId: number)
	{

		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: { notifications: true },
		});

		if (!user)
			throw new Error("User not found");

		await this.deleteNotificationById(userId, notificationId);

		const myNotifs = await this.getNotificationsById(userId);

		return myNotifs;
	}

	async deleteNotificationById(userId: number, notificationId: number)
	{
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
			include: { notifications: true },
		});

		if (!user)
			throw new Error("User not found");

		let deletedNotification = await this.prismaService.notification.findFirst({
			where: { id: notificationId },
		});

		deletedNotification = await this.prismaService.notification.delete({
			where: { id: notificationId },
		});

		return deletedNotification;
	}

	async getSingleNotificationById(notificationId: number)
	{
		const notification = await this.prismaService.notification.findUnique({
			where: { id: notificationId },
		});

		if (!notification)
			throw new Error("Notification not found");

		return (notification);
	}

}
