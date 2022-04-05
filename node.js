const { v4: uuidv4 } = require("uuid");
const { createGrpcService, createGrpcServer } = require("./src/grpc");

const raftId = uuidv4();
const grpcAddress = process.argv[2];

console.log("raftid: " + raftId);
console.log("grpc address: " + grpcAddress);

const proxyService = createGrpcService(
  "proxy",
  "ProxyService",
  "127.0.0.1:50051"
);

const { proto, server } = createGrpcServer("raft", grpcAddress);

server.addService(proto.RaftService.service, {
  HandleMessage: (call, callback) => {
    console.log(`[message] ${call.request.json} from ${call.request.senderId}`);

    callback(null, null);
  },
});

const interval = setInterval(function () {
  proxyService.SaveHeartbeat(
    {
      id: raftId,
      address: grpcAddress,
      sentAt: new Date().getTime(),
    },
    (error) => {
      if (error) throw error;
    }
  );
}, 1000);

setInterval(function () {
  proxyService.MessageAll(
    {
      json: "hello world!",
      senderId: raftId,
    },
    (error) => {
      if (error) throw error;
    }
  );
}, 4000);
