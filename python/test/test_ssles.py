import unittest

from ethsnarks.field import FQ
from ethsnarks.mimc import mimc_hash
from ethsnarks.utils import native_lib_path
from ethsnarks.merkletree import MerkleTree
from ssles import Ssles


NATIVE_LIB_PATH = native_lib_path('../.build/libssles')
VK_PATH = '../.keys/ssles.vk.json'
PK_PATH = '../.keys/ssles.pk.raw'


class TestSssles(unittest.TestCase):
	def test_make_proof(self):
		n_items = 2<<28
		tree = MerkleTree(n_items)
		for n in range(0, 2):
			tree.append(int(FQ.random()))

	
		secret = int(FQ.random())
		leaf_hash = mimc_hash([secret])
		prehash = mimc_hash([msg])
		leaf_idx = tree.append(leaf_hash)
		self.assertEqual(leaf_idx, tree.index(leaf_hash))

		# Verify it exists in true
		leaf_proof = tree.proof(leaf_idx)
		self.assertTrue(leaf_proof.verify(tree.root))

		# Generate proof		
		wrapper = Ssles(NATIVE_LIB_PATH, VK_PATH, PK_PATH)
		tree_depth = wrapper.tree_depth
		snark_proof = wrapper.prove(
			tree.root,
			secret,
			prehash,
			msg,
			leaf_proof.address,
			leaf_proof.path)
		     
          
       

		self.assertTrue(wrapper.verify(snark_proof))


if __name__ == "__main__":
	unittest.main()
