
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const IpAddress = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request>();
        // Check for x-forwarded-for header in case of reverse proxy, otherwise use connection remoteAddress
        const xForwardedFor = request.headers['x-forwarded-for'];
        if (xForwardedFor) {
            // x-forwarded-for can be a list of IPs, take the first one
            return Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor.split(',')[0];
        }
        return request.ip || request.socket.remoteAddress;
    },
);
