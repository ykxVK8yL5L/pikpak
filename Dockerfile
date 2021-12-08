FROM golang:1.16 AS builder
WORKDIR /go/src/app
COPY ./ /go/src/app
RUN go mod vendor
RUN CGO_ENABLED=0 GOOS=linux go build --ldflags "-extldflags -static" -a -installsuffix cgo -o app .


FROM scratch
WORKDIR /root/
COPY ./dist /root/dist
COPY --from=builder /go/src/app/app ./
CMD ["./app"]
