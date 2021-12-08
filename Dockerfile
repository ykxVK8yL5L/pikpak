FROM golang:1.16 AS builder
WORKDIR /go/src/app
COPY ./ /go/src/app
RUN go mod vendor
RUN CGO_ENABLED=1 GOOS=linux go build --ldflags "-extldflags -static" -a -installsuffix cgo -o app .


FROM alpine:3.6 as alpine
RUN apk add -U --no-cache ca-certificates
WORKDIR /root/
COPY ./dist /root/dist
COPY --from=builder /go/src/app/app ./
CMD ["./app"]
