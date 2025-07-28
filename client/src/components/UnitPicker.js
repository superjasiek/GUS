import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DualListBox from 'react-dual-listbox';
import 'react-dual-listbox/lib/react-dual-listbox.css';

const API_URL = 'http://192.168.1.182:3001/api';

const UnitPicker = ({ selectedUnits, setSelectedUnits }) => {
  const [availableUnits, setAvailableUnits] = useState([]);
  const [tree, setTree] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/units?level=0`)
      .then(response => {
        const poland = response.data.results[0];
        setTree([{ ...poland, level: 0, children: [] }]);
      });
  }, []);

  const onNodeToggle = async (node) => {
    if (!node.children || node.children.length === 0) {
      const response = await axios.get(`${API_URL}/units?level=${node.level + 1}&parentId=${node.id}`);
      const children = response.data.results.map(child => ({ ...child, level: node.level + 1, children: [] }));
      setTree(prevTree => {
        const newTree = [...prevTree];
        const nodeToUpdate = findNode(newTree, node.id);
        nodeToUpdate.children = children;
        return newTree;
      });
    }
  };

  const findNode = (nodes, id) => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
  };

  const renderTree = (nodes) => {
    return (
      <ul>
        {nodes.map(node => (
          <li key={node.id}>
            <span onClick={() => onNodeToggle(node)}>{node.name}</span>
            <button onClick={() => setAvailableUnits(prev => [...prev, { value: node.id, label: node.name }])}>+</button>
            {node.children && renderTree(node.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div>
      <div>
        <h3>Dostępne jednostki</h3>
        {renderTree(tree)}
      </div>
      <DualListBox
        options={availableUnits}
        selected={selectedUnits}
        onChange={(selected) => setSelectedUnits(selected)}
      />
    </div>
  );
};

export default UnitPicker;
