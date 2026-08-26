const express = require('express');
const User = require('../models/User');

const router = express.Router();

class TrieNode {
    constructor() {
        this.children = new Map();
        this.names = [];
    }
}

const trieRoot = new TrieNode();
let loaded = false;

function clearTrie() {
    trieRoot.children.clear();
    trieRoot.names = [];
    loaded = false;
}

function insertName(name) {
    if (typeof name !== 'string' || !name.trim()) {
        return;
    }

    const normalizedName = name.trim().toLowerCase();
    let currentNode = trieRoot;

    for (const character of normalizedName) {
        if (!currentNode.children.has(character)) {
            currentNode.children.set(character, new TrieNode());
        }
        currentNode = currentNode.children.get(character);
    }

    if (!currentNode.names.includes(name.trim())) {
        currentNode.names.push(name.trim());
    }
}

async function initializeTrie() {
    const users = await User.find({}, { name: 1, _id: 0 }).lean();
    clearTrie();

    for (const user of users) {
        insertName(user.name);
    }

    loaded = true;
    return users.length;
}

async function findNamesWithPrefix(prefix, limit = 10) {
    const normalizedPrefix = typeof prefix === 'string' ? prefix.trim().toLowerCase() : '';
    if (!normalizedPrefix) {
        return [];
    }

    let currentNode = trieRoot;
    for (const character of normalizedPrefix) {
        currentNode = currentNode.children.get(character);
        if (!currentNode) {
            return [];
        }
    }

    const matches = [];
    const dfs = async (node) => {
        if (matches.length >= limit) {
            return;
        }

        matches.push(...node.names);
        for (const childNode of node.children.values()) {
            await dfs(childNode);
            if (matches.length >= limit) {
                break;
            }
        }
    };

    await dfs(currentNode);
    return matches.slice(0, limit);
}

// Allows the trie to be refreshed without restarting the server.
router.post('/initialize', async (req, res) => {
    try {
        const userCount = await initializeTrie();
        res.status(200).json({ message: 'Autocomplete trie initialized', userCount });
    } catch (error) {
        res.status(500).json({ message: `Could not initialize autocomplete trie: ${error.message}` });
    }
});

router.get('/search', async (req, res) => {
    try {
        const names = await findNamesWithPrefix(req.query.prefix);
        res.status(200).json({ names });
    } catch (error) {
        res.status(500).json({ message: `Could not search autocomplete trie: ${error.message}` });
    }
});

module.exports = router;
module.exports.initializeTrie = initializeTrie;
