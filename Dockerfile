FROM node:22-alpine AS build

WORKDIR /workspace

COPY thingdex-sdk ./thingdex-sdk
COPY printhub-sdk ./printhub-sdk
COPY ThingdexUI ./ThingdexUI

WORKDIR /workspace/thingdex-sdk
RUN npm ci
RUN npm run build

WORKDIR /workspace/printhub-sdk
RUN npm ci
RUN npm run build

WORKDIR /workspace/ThingdexUI
RUN npm ci
RUN npm run build

FROM nginx:1.25-alpine

RUN apk add --no-cache gettext

COPY --from=build /workspace/ThingdexUI/dist /usr/share/nginx/html
COPY --from=build /workspace/ThingdexUI/docker/nginx.conf.template /etc/nginx/nginx.conf.template
COPY --from=build /workspace/ThingdexUI/public/config.template.js /usr/share/nginx/html/config.template.js
COPY --from=build /workspace/ThingdexUI/docker/entrypoint.sh /entrypoint.sh

RUN sed -i 's/\r$//' /entrypoint.sh \
    && chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
