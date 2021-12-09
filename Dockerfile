FROM golang:1.16 AS builder
RUN apt-get update && apt-get install -y xz-utils \
    && rm -rf /var/lib/apt/lists/*
ADD https://github.com/upx/upx/releases/download/v3.95/upx-3.95-amd64_linux.tar.xz /usr/local
RUN xz -d -c /usr/local/upx-3.95-amd64_linux.tar.xz | tar -xOf - upx-3.95-amd64_linux/upx > /bin/upx && \
    chmod a+x /bin/upx
WORKDIR /go/src/app
COPY ./ /go/src/app
RUN go mod vendor
RUN CGO_ENABLED=0 GOOS=linux go build --ldflags "-s -w -extldflags -static" -a -installsuffix cgo -o app .
RUN strip --strip-unneeded app
RUN upx app

FROM scratch
WORKDIR /root/
COPY ./dist /root/dist
COPY --from=builder /go/src/app/app ./
CMD ["./app"]
