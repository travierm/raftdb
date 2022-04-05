const { createGrpcServer, createGrpcService } = require("./src/grpc");

const { proto, server } = createGrpcServer("proxy", "127.0.0.1:50051");
class NodeStorage {
  constructor() {
    this.nodes = [];
  }

  getByID(id) {
    return this.nodes.find((node) => node.id === id);
  }
  create(node) {
    const existingNode = this.getByID(node.id);

    if (!existingNode) {
      this.nodes.push(node);

      return true;
    }

    return false;
  }
}

const nodeStorage = new NodeStorage();

server.addService(proto.ProxyService.service, {
  MessageAll: (call, callback) => {
    nodeStorage.nodes.forEach((node) => {
      if (node.id === call.request.senderId) {
        return;
      }

      node.raftService.HandleMessage(call.request, (error) => {
        if (error) throw error;
      });

      callback(null, null);
    });
  },
  SaveHeartbeat: (call, callback) => {
    console.log(
      "[heartbeat] id: " +
        call.request.id.substr(0, 7) +
        " address: " +
        call.request.address
    );

    if (!nodeStorage.getByID(call.request.id)) {
      const raftService = createGrpcService(
        "raft",
        "RaftService",
        call.request.address
      );

      nodeStorage.create({
        raftService,
        ...call.request,
      });

      console.log("created new node " + call.request.id.substr(0, 7));
    }

    callback(null, null);
  },
});
