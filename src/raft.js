const { getRandomInt } = require("./utils");

const RAFT_STATES = {
  LEADER: "leader",
  CANDIDATE: "candidate",
  FOLLOWER: "follower",
};

const DEFAULT_STATE = RAFT_STATES.FOLLOWER;
const ELECTION_TIMEOUT_MAX = 3000;
const ELECTION_TIMEOUT_MIN = 6000;

const EVENT_TYPES = {
  VOTED: "voted",
  VOTE_FOR_ME: "vote_for_me",
  COMMIT_CHANGE: "commit_change",
  LEADER_HEARTBEAT: "leader_heartbeat",
  NEW_ELECTION_TERM: "new_election_term",
};

class RaftEngine {
  constructor(raftId, proxyService) {
    this.raftId = raftId;
    this.state = DEFAULT_STATE;
    this.electionTimer = null;
    this.leaderTimer = null;
    this.proxyService = proxyService;
    this.leaderId = null;
    this.nodeIds = [];

    // determined by leader
    this.term = 0;
    this.votesReceived = 0;
    this.votedFor = null;

    this.startElectionTimer();
  }

  handleEvent(event) {
    switch (event.type) {
      case EVENT_TYPES.LEADER_HEARTBEAT:
        this.handleLeaderHeartbeat(event);
        return;
      case EVENT_TYPES.VOTE_FOR_ME:
        this.handleVoteForMe(event);
        return;
      case EVENT_TYPES.VOTED:
        this.handleVoted(event);
        return;
    }
  }

  startElectionTimer() {
    clearInterval(this.electionTimer);

    const timeout = getRandomInt(ELECTION_TIMEOUT_MIN, ELECTION_TIMEOUT_MAX);

    this.electionTimer = setInterval(
      this.handleElectionTimeout.bind(this),
      timeout
    );
  }

  startHeartbeatTimer() {
    clearInterval(this.leaderTimer);

    this.leaderTimer = setInterval(this.handleLeaderTimer.bind(this), 100);
  }

  sendVote(leaderId) {
    this.proxyService.SendEvent(
      {
        type: EVENT_TYPES.VOTED,
        value: leaderId,
        term: this.term,
        senderId: this.raftId,
      },
      (error) => {
        if (error) throw error;
      }
    );
  }

  sendNewTerm() {
    this.proxyService.SendEvent(
      {
        type: EVENT_TYPES.NEW_ELECTION_TERM,
        value: this.raftId,
        term: this.term + 1,
        senderId: this.raftId,
      },
      (error) => {
        if (error) throw error;
      }
    );
  }

  sendVoteForMe() {
    this.proxyService.SendEvent(
      {
        type: EVENT_TYPES.VOTE_FOR_ME,
        value: this.raftId,
        term: this.term,
        senderId: this.raftId,
      },
      (error) => {
        if (error) throw error;
      }
    );
  }

  handleVoteForMe(event) {
    console.log("got vote request");

    if (this.state !== RAFT_STATES.CANDIDATE) {
      console.log("voting for " + event.value);
      this.sendVote(event.value);
    }
  }

  handleLeaderTimer() {
    this.proxyService.SendEvent(
      {
        type: EVENT_TYPES.LEADER_HEARTBEAT,
        value: this.raftId,
        term: this.term,
        senderId: this.raftId,
      },
      (error) => {
        if (error) throw error;
      }
    );
  }

  handleElectionTimeout() {
    console.log("asking for votes");

    this.state = RAFT_STATES.CANDIDATE;
    this.sendVoteForMe();

    this.startElectionTimer();
  }

  handleLeaderHeartbeat(event) {
    if (this.term !== event.term) {
      this.term = event.term;
      this.leaderId = event.value;
      this.votesReceived = 0;

      console.log("new leader was elected " + event.value);
    }

    if (event.senderId === this.raftId) {
      return;
    }

    this.state = RAFT_STATES.FOLLOWER;
    this.startElectionTimer();
  }

  handleVoted(event) {
    if (event.value === this.raftId && event.senderId !== this.raftId) {
      this.votesReceived++;
      console.log(
        "got vote from " +
          event.senderId +
          " for a total of " +
          this.votesReceived +
          " votes"
      );
    }

    if (this.state === RAFT_STATES.CANDIDATE && this.votesReceived >= 1) {
      this.sendNewTerm();

      this.term++;
      this.votesReceived = 0;
      this.state = RAFT_STATES.LEADER;
      this.startHeartbeatTimer();

      clearInterval(this.electionTimer);

      console.log("Won new election on term " + this.term);
    }
  }
}

module.exports = { RaftEngine };
