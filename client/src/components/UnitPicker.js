import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://192.168.1.182:3001/api';

const TreeNode = ({ node, onNodeToggle, onUnitAdd }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    onNodeToggle(node);
    setIsOpen(!isOpen);
  };

  return (
    <li>
      <span onClick={handleToggle} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
        <span>{isOpen ? '[-]' : '[+]'}&nbsp;{node.name}</span>
      </span>
      <button onClick={() => onUnitAdd({ value: node.id, label: node.name })} style={{ marginLeft: '5px' }}>+</button>
      {isOpen && node.children && (
        <ul>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} onNodeToggle={onNodeToggle} onUnitAdd={onUnitAdd} />
          ))}
        </ul>
      )}
    </li>
  );
};

const UnitPicker = ({ selectedUnits, setSelectedUnits }) => {
  const [tree, setTree] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/units?level=0`)
      .then(response => {
        const poland = response.data.results[0];
        setTree([{ ...poland, level: 0, children: [] }]);
      });
  }, []);

  const onNodeToggle = async (node) => {
    if ((!node.children || node.children.length === 0) && node.level < 6) {
      let nextLevel = node.level + 1;
      if (node.level === 0) nextLevel = 2; // Polska -> Województwo
      if (node.level === 2) nextLevel = 5; // Województwo -> Powiat
      if (node.level === 5) nextLevel = 6; // Powiat -> Gmina
      if (node.level === 6) { // Gmina -> Miasto/Obszar wiejski
        const response = await axios.get(`${API_URL}/units?level=7&parentId=${node.id}`);
        const children = response.data.results.map(child => ({ ...child, level: 7, children: [] }));
        setTree(prevTree => {
          const newTree = JSON.parse(JSON.stringify(prevTree));
          const nodeToUpdate = findNode(newTree, node.id);
          nodeToUpdate.children = children;
          return newTree;
        });
        return;
      }


      const response = await axios.get(`${API_URL}/units?level=${nextLevel}&parentId=${node.id}`);
      const children = response.data.results.map(child => ({ ...child, level: nextLevel, children: [] }));
      setTree(prevTree => {
        const newTree = JSON.parse(JSON.stringify(prevTree)); // Deep copy
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

  const handleUnitAdd = (unit) => {
    if (!selectedUnits.some(u => u.value === unit.value)) {
      setSelectedUnits(prev => [...prev, unit]);
    }
  };

  const handleUnitRemove = (unit) => {
    setSelectedUnits(prev => prev.filter(u => u.value !== unit.value));
  };

  const handleRemoveAll = () => {
    setSelectedUnits([]);
  };

  return (
    <div className="unit-picker">
      <div className="unit-tree">
        <h3>Dostępne jednostki</h3>
        <ul>
          {tree.map(node => (
            <TreeNode key={node.id} node={node} onNodeToggle={onNodeToggle} onUnitAdd={handleUnitAdd} />
          ))}
        </ul>
      </div>
      <div className="selected-units">
        <h3>Wybrane jednostki</h3>
        <button onClick={handleRemoveAll}>Usuń wszystko</button>
        <ul>
          {selectedUnits.map(unit => (
            <li key={unit.value}>
              {unit.label}
              <button onClick={() => handleUnitRemove(unit)}>Usuń</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UnitPicker;
