const { getRandomInt } = require("./utils");

const RAFT_STATES = {
  LEADER: "leader",
  CANDIDATE: "candidate",
  FOLLOWER: "follower",
};

const DEFAULT_STATE = RAFT_STATES.FOLLOWER;
const ELECTION_TIMEOUT_MAX = 300;
const ELECTION_TIMEOUT_MIN = 150;

const EVENT_TYPES = {
  VOTE_FOR_ME: "vote_for_me",
  COMMIT_CHANGE: "commit_change",
  LEADER_HEARTBEAT: "leader_heartbeat",
};

class RaftEngine {
  constructor(proxyService) {
    this.state = DEFAULT_STATE;
    this.electionTimer = null;
    this.proxyService = proxyService;
  }

  handleEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.LEADER_HEARTBEAT:
        this.handleLeaderHeartbeat(event);
        return;
      case EVENT_TYPES.VOTE_FOR_ME:
        this.handleVoteForMe(event);
        return;
    }
  }

  startElectionTimer() {
    const timeout = getRandomInt(ELECTION_TIMEOUT_MIN, ELECTION_TIMEOUT_MAX);

    this.electionTimer = setInterval(this.handleElectionTimeout, timeout);
  }

  handleVoteForMe(event) {
    console.log("vote for me " + event.sender_id);
  }

  handleLeaderHeartbeat(event) {
    console.log("leader heartbeat");
    this.startElectionTimer();
  }

  handleElectionTimeout() {
    console.log("election timeout reached");
  }
}

module.exports = { RaftEngine };
