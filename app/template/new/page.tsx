'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Clock,
  Type,
  Image,
  CheckSquare,
  Smile,
  Calendar,
  Cloud,
  ChevronDown,
  TrendingUp,
  BarChart,
  GitBranch,
  AlertCircle,
  Link as LinkIcon,
  ListTodo,
  Map,
  Bell,
  ChevronRight,
  X,
} from 'lucide-react';
import { Block, BlockType, NotificationSettings } from '@/types/template';
import { blockPalette } from '@/lib/blockPalette';

type Step = 'name' | 'blocks' | 'notification';

interface BlockPosition {
  id: string;
  type: BlockType;
  row: number;       // 행 번호
  x: number;         // 행 내에서의 수평 위치 (픽셀, 0부터 시작)
  y: number;         // 행 내에서의 수직 위치 (픽셀, 0부터 시작)
  width: number;     // 블록의 너비 (픽셀)
  height: number;    // 블록의 높이 (픽셀, 기본 120)
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('name');
  const [templateName, setTemplateName] = useState('');
  const [blockPositions, setBlockPositions] = useState<BlockPosition[]>([]);
  const [showPalette, setShowPalette] = useState(false);
  const [draggedBlock, setDraggedBlock] = useState<BlockPosition | null>(null);
  const [dropTarget, setDropTarget] = useState<{ blockId: string; position: 'left' | 'right' | 'below' | 'above' } | null>(null);
  const [touchDragInfo, setTouchDragInfo] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const [resizingBlock, setResizingBlock] = useState<{ blockId: string; direction: 'right' | 'bottom'; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [notification, setNotification] = useState<NotificationSettings>({
    enabled: false,
  });

  // 아이콘 매핑
  const iconMap: Record<string, any> = {
    Clock,
    Type,
    Image,
    CheckSquare,
    Smile,
    Calendar,
    Cloud,
    ChevronDown,
    TrendingUp,
    BarChart,
    GitBranch,
    AlertCircle,
    Link: LinkIcon,
    ListTodo,
    Map,
  };

  // 컨테이너 너비 측정
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.getElementById('blocks-container');
      if (container) {
        const width = container.clientWidth;
        setContainerWidth(width);
      } else {
        // fallback: 컨테이너가 아직 없으면 기본 계산
        const width = window.innerWidth - 32;
        setContainerWidth(width);
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);

    return () => window.removeEventListener('resize', updateContainerWidth);
  }, [blockPositions.length]); // blockPositions가 변경되면 재측정

  // 블록 추가 (새 행에 전체 너비로 추가)
  const addBlock = (type: BlockType) => {
    const maxRow = blockPositions.length > 0 ? Math.max(...blockPositions.map(b => b.row)) : -1;
    const newBlock: BlockPosition = {
      id: `block-${Date.now()}`,
      type,
      row: maxRow + 1,
      x: 0,
      y: 0,
      width: containerWidth, // 전체 너비
      height: 120, // 기본 높이
    };

    setBlockPositions([...blockPositions, newBlock]);
    setShowPalette(false);
  };

  // 블록 삭제
  const removeBlock = (id: string) => {
    const removedBlock = blockPositions.find(b => b.id === id);
    if (!removedBlock) return;

    let updatedBlocks = blockPositions.filter(block => block.id !== id);

    // 삭제된 블록이 속한 행이 비었으면 그 아래 행들의 row 번호 감소
    const rowBlocks = updatedBlocks.filter(b => b.row === removedBlock.row);
    if (rowBlocks.length === 0) {
      updatedBlocks = updatedBlocks.map(block => {
        if (block.row > removedBlock.row) {
          return { ...block, row: block.row - 1 };
        }
        return block;
      });
    }

    setBlockPositions(updatedBlocks);
  };

  // 행별로 블록 그룹화
  const getBlocksByRow = (row: number) => {
    return blockPositions
      .filter(b => b.row === row)
      .sort((a, b) => a.x - b.x);
  };

  // 전체 행 배열 생성
  const getAllRows = () => {
    if (blockPositions.length === 0) return [];
    const maxRow = Math.max(...blockPositions.map(b => b.row));
    return Array.from({ length: maxRow + 1 }, (_, i) => i);
  };

  // 블록 간 충돌 검사 (2D)
  const checkBlockCollision = (
    newBlock: { x: number; y: number; width: number; height: number },
    existingBlock: BlockPosition
  ): boolean => {
    // 두 블록이 겹치는지 확인
    const horizontalOverlap =
      newBlock.x < existingBlock.x + existingBlock.width &&
      newBlock.x + newBlock.width > existingBlock.x;

    const verticalOverlap =
      newBlock.y < existingBlock.y + existingBlock.height &&
      newBlock.y + newBlock.height > existingBlock.y;

    return horizontalOverlap && verticalOverlap;
  };

  // 특정 위치에 블록을 배치할 수 있는지 확인 (같은 행 내에서)
  const canPlaceBlock = (
    blocks: BlockPosition[],
    row: number,
    x: number,
    y: number,
    width: number,
    height: number,
    excludeBlockId?: string
  ): boolean => {
    const rowBlocks = blocks.filter(b => b.row === row && b.id !== excludeBlockId);

    for (const block of rowBlocks) {
      if (checkBlockCollision({ x, y, width, height }, block)) {
        return false;
      }
    }

    return true;
  };

  // 드래그 시작
  const handleDragStart = (block: BlockPosition) => {
    setDraggedBlock(block);
  };

  // 드롭 처리
  const handleDrop = (e: React.DragEvent, targetBlock: BlockPosition) => {
    e.preventDefault();

    console.log('handleDrop called', { draggedBlock, dropTarget, targetBlock });

    if (!draggedBlock || !dropTarget || draggedBlock.id === targetBlock.id) {
      console.log('Drop cancelled', { hasNoDraggedBlock: !draggedBlock, hasNoDropTarget: !dropTarget, isSameBlock: draggedBlock?.id === targetBlock.id });
      return;
    }

    let updatedBlocks = blockPositions.filter(b => b.id !== draggedBlock.id);
    let newBlock: BlockPosition;

    const minBlockWidth = 70; // 최소 블록 너비 (3개까지 가능하도록: 70*3 + 12*2 = 234px)

    if (dropTarget.position === 'above') {
      // 위 배치: 새 행을 생성
      updatedBlocks = updatedBlocks.map(block => {
        if (block.row >= targetBlock.row) {
          return { ...block, row: block.row + 1 };
        }
        return block;
      });

      // 새 행에는 항상 전체 너비로 배치, 위치는 (0, 0)에서 시작
      newBlock = {
        id: draggedBlock.id,
        type: draggedBlock.type,
        row: targetBlock.row,
        x: 0,
        y: 0,
        width: containerWidth,
        height: draggedBlock.height // 높이만 유지
      };
    } else if (dropTarget.position === 'below') {
      // 아래 배치: 타겟 블록 바로 밑에 배치 시도 (같은 행, 같은 x/width)
      const newY = targetBlock.y + targetBlock.height + 12;

      // 타겟과 같은 x, width로 바로 밑에 배치 가능한지 확인
      if (canPlaceBlock(updatedBlocks, targetBlock.row, targetBlock.x, newY, targetBlock.width, draggedBlock.height, draggedBlock.id)) {
        newBlock = {
          id: draggedBlock.id,
          type: draggedBlock.type,
          row: targetBlock.row,
          x: targetBlock.x,
          y: newY,
          width: targetBlock.width,
          height: draggedBlock.height
        };
      } else {
        // 배치 불가능하면 새 행 생성
        updatedBlocks = updatedBlocks.map(block => {
          if (block.row > targetBlock.row) {
            return { ...block, row: block.row + 1 };
          }
          return block;
        });

        newBlock = {
          id: draggedBlock.id,
          type: draggedBlock.type,
          row: targetBlock.row + 1,
          x: 0,
          y: 0,
          width: containerWidth,
          height: draggedBlock.height
        };
      }
    } else {
      // 같은 행에 배치 (왼쪽/오른쪽)
      const rowBlocks = updatedBlocks.filter(b => b.row === targetBlock.row).sort((a, b) => a.x - b.x);
      const targetIndex = rowBlocks.findIndex(b => b.id === targetBlock.id);

      // 행의 실제 사용 가능한 공간 계산
      const totalUsedWidth = rowBlocks.reduce((sum, b) => sum + b.width + 12, 0) - 12; // 마지막 gap 제외
      const availableSpace = containerWidth - totalUsedWidth;

      if (dropTarget.position === 'left') {
        // 왼쪽에 배치
        // 왼쪽 여유 공간 확인 (타겟 블록 왼쪽에 공간이 있는지)
        const leftSpace = targetBlock.x;

        // 타겟 블록 아래에 세로로 쌓을 수 있는지 확인
        const sameXBlocks = rowBlocks.filter(b =>
          b.x === targetBlock.x && b.width === targetBlock.width
        ).sort((a, b) => a.y - b.y);
        const targetIndexInColumn = sameXBlocks.findIndex(b => b.id === targetBlock.id);
        const nextBlockInColumn = sameXBlocks[targetIndexInColumn + 1];
        const spaceBelow = nextBlockInColumn
          ? nextBlockInColumn.y - (targetBlock.y + targetBlock.height)
          : Infinity; // 아래에 블록이 없으면 무한대

        if (leftSpace >= minBlockWidth + 12) {
          // 왼쪽에 공간이 있으면 거기에 배치 (가로 배치는 항상 y=0)
          const newBlockWidth = Math.min(leftSpace - 12, draggedBlock.width);
          const newX = targetBlock.x - newBlockWidth - 12;

          newBlock = { ...draggedBlock, row: targetBlock.row, x: newX, y: 0, width: newBlockWidth };
        } else if (targetBlock.width >= minBlockWidth + 12) {
          // 왼쪽 공간이 없지만 타겟 블록을 나눌 수 있으면 나눔
          // 새 블록 크기는 최소 너비와 타겟의 절반 중 작은 값
          const newBlockWidth = Math.max(minBlockWidth, Math.floor((targetBlock.width - 12) / 2));
          const remainingWidth = targetBlock.width - newBlockWidth - 12;

          if (remainingWidth >= minBlockWidth) {
            updatedBlocks = updatedBlocks.map(block => {
              if (block.id === targetBlock.id) {
                return { ...block, x: block.x + newBlockWidth + 12, width: remainingWidth, y: 0 };
              }
              if (block.row === targetBlock.row && block.x > targetBlock.x) {
                return { ...block, x: block.x + newBlockWidth + 12 };
              }
              return block;
            });

            newBlock = { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: 0, width: newBlockWidth };
            console.log('Split target block and placed on left', newBlock);
          } else {
            // 나눌 수 없으면 새 행 생성
            updatedBlocks = updatedBlocks.map(block => {
              if (block.row > targetBlock.row) {
                return { ...block, row: block.row + 1 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
          }
        } else if (spaceBelow >= draggedBlock.height + 12) {
          // 타겟 블록 아래에 세로로 쌓기
          const newY = targetBlock.y + targetBlock.height + 12;

          // 타겟과 같은 x, width로 바로 밑에 배치
          if (canPlaceBlock(updatedBlocks, targetBlock.row, targetBlock.x, newY, targetBlock.width, draggedBlock.height, draggedBlock.id)) {
            newBlock = { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: newY, width: targetBlock.width };
          } else {
            // 충돌하면 새 행 생성
            updatedBlocks = updatedBlocks.map(block => {
              if (block.row > targetBlock.row) {
                return { ...block, row: block.row + 1 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
          }
        } else if (availableSpace >= minBlockWidth) {
          // 행 끝에 여유 공간이 있으면 타겟 블록 축소하고 왼쪽에 배치
          const spaceForNewBlock = Math.min(Math.floor(targetBlock.width / 2), availableSpace);
          if (spaceForNewBlock >= minBlockWidth) {
            updatedBlocks = updatedBlocks.map(block => {
              if (block.id === targetBlock.id) {
                return { ...block, x: block.x + spaceForNewBlock + 12, width: block.width - spaceForNewBlock - 12 };
              }
              if (block.row === targetBlock.row && block.x > targetBlock.x) {
                return { ...block, x: block.x + spaceForNewBlock + 12 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: 0, width: spaceForNewBlock };
          } else {
            // 공간이 부족하면 새 행 생성
            updatedBlocks = updatedBlocks.map(block => {
              if (block.row > targetBlock.row) {
                return { ...block, row: block.row + 1 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
          }
        } else {
          // 공간이 부족하면 새 행 생성
          updatedBlocks = updatedBlocks.map(block => {
            if (block.row > targetBlock.row) {
              return { ...block, row: block.row + 1 };
            }
            return block;
          });
          newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
        }
      } else {
        // 오른쪽에 배치
        // 오른쪽 여유 공간 확인
        const rightEdge = targetBlock.x + targetBlock.width;
        const nextBlock = rowBlocks[targetIndex + 1];
        const rightSpace = nextBlock ? nextBlock.x - rightEdge - 12 : containerWidth - rightEdge;

        console.log('Right drop attempt', {
          rightEdge,
          nextBlock,
          rightSpace,
          containerWidth,
          minBlockWidth,
          targetBlock,
          rowBlocks
        });

        // 타겟 블록 아래에 세로로 쌓을 수 있는지 확인
        const sameXBlocks = rowBlocks.filter(b =>
          b.x === targetBlock.x && b.width === targetBlock.width
        ).sort((a, b) => a.y - b.y);
        const targetIndexInColumn = sameXBlocks.findIndex(b => b.id === targetBlock.id);
        const nextBlockInColumn = sameXBlocks[targetIndexInColumn + 1];
        const spaceBelow = nextBlockInColumn
          ? nextBlockInColumn.y - (targetBlock.y + targetBlock.height)
          : Infinity; // 아래에 블록이 없으면 무한대

        console.log('Space below check', { sameXBlocks, spaceBelow, draggedBlockHeight: draggedBlock.height });

        if (rightSpace >= minBlockWidth) {
          // 오른쪽에 공간이 있으면 거기에 배치 (가로 배치는 항상 y=0)
          const newBlockWidth = Math.min(rightSpace, draggedBlock.width);
          const newX = rightEdge + 12;

          newBlock = { ...draggedBlock, row: targetBlock.row, x: newX, y: 0, width: newBlockWidth };
          console.log('Placed on right', newBlock);
        } else if (targetBlock.width >= minBlockWidth + 12) {
          // 오른쪽 공간이 없지만 타겟 블록을 나눌 수 있으면 나눔
          // 새 블록 크기는 최소 너비와 타겟의 절반 중 작은 값
          const newBlockWidth = Math.max(minBlockWidth, Math.floor((targetBlock.width - 12) / 2));
          const remainingWidth = targetBlock.width - newBlockWidth - 12;

          if (remainingWidth >= minBlockWidth) {
            updatedBlocks = updatedBlocks.map(block => {
              if (block.id === targetBlock.id) {
                return { ...block, width: remainingWidth, y: 0 };
              }
              return block;
            });

            newBlock = { ...draggedBlock, row: targetBlock.row, x: targetBlock.x + remainingWidth + 12, y: 0, width: newBlockWidth };
            console.log('Split target block and placed on right', newBlock);
          } else {
            // 나눌 수 없으면 새 행 생성
            updatedBlocks = updatedBlocks.map(block => {
              if (block.row > targetBlock.row) {
                return { ...block, row: block.row + 1 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
          }
        } else if (spaceBelow >= draggedBlock.height + 12) {
          // 타겟 블록 아래에 세로로 쌓기
          const newY = targetBlock.y + targetBlock.height + 12;

          // 타겟과 같은 x, width로 바로 밑에 배치
          const canPlace = canPlaceBlock(updatedBlocks, targetBlock.row, targetBlock.x, newY, targetBlock.width, draggedBlock.height, draggedBlock.id);
          console.log('Trying to place below (right branch)', { newY, canPlace, targetBlock });

          if (canPlace) {
            newBlock = { ...draggedBlock, row: targetBlock.row, x: targetBlock.x, y: newY, width: targetBlock.width };
            console.log('Placed below successfully', newBlock);
          } else {
            // 충돌하면 새 행 생성
            updatedBlocks = updatedBlocks.map(block => {
              if (block.row > targetBlock.row) {
                return { ...block, row: block.row + 1 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
          }
        } else if (availableSpace >= minBlockWidth) {
          // 행 끝에 여유 공간이 있으면 타겟 블록 축소하고 오른쪽에 배치
          const spaceForNewBlock = Math.min(Math.floor(targetBlock.width / 2), availableSpace);
          if (spaceForNewBlock >= minBlockWidth) {
            updatedBlocks = updatedBlocks.map(block => {
              if (block.id === targetBlock.id) {
                return { ...block, width: block.width - spaceForNewBlock - 12 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row, x: targetBlock.x + targetBlock.width - spaceForNewBlock - 12, y: 0, width: spaceForNewBlock };
          } else {
            // 공간이 부족하면 새 행 생성
            updatedBlocks = updatedBlocks.map(block => {
              if (block.row > targetBlock.row) {
                return { ...block, row: block.row + 1 };
              }
              return block;
            });
            newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
          }
        } else {
          // 공간이 부족하면 새 행 생성
          updatedBlocks = updatedBlocks.map(block => {
            if (block.row > targetBlock.row) {
              return { ...block, row: block.row + 1 };
            }
            return block;
          });
          newBlock = { ...draggedBlock, row: targetBlock.row + 1, x: 0, y: 0, width: containerWidth };
        }
      }
    }

    // 드래그된 블록의 원래 행이 비었으면 아래 행들 올리기
    const originalRowBlocks = updatedBlocks.filter(b => b.row === draggedBlock.row);
    if (originalRowBlocks.length === 0) {
      updatedBlocks = updatedBlocks.map(block => {
        if (block.row > draggedBlock.row) {
          return { ...block, row: block.row - 1 };
        }
        return block;
      });
      if (newBlock.row > draggedBlock.row) {
        newBlock = { ...newBlock, row: newBlock.row - 1 };
      }
    }

    updatedBlocks.push(newBlock);
    console.log('Final state before setBlockPositions', { updatedBlocks, newBlock });
    setBlockPositions(updatedBlocks);

    // 상태 업데이트 직후 확인
    setTimeout(() => {
      console.log('After setBlockPositions - getAllRows:', getAllRows());
      console.log('After setBlockPositions - blockPositions:', blockPositions);
    }, 100);

    setDraggedBlock(null);
    setDropTarget(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedBlock(null);
    setDropTarget(null);
  };

  // 터치 시작 (모바일)
  const handleTouchStart = (e: React.TouchEvent, block: BlockPosition) => {
    e.stopPropagation();
    const touch = e.touches[0];
    setDraggedBlock(block);
    setTouchDragInfo({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });
  };

  // 터치 이동 (모바일)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedBlock || !touchDragInfo) return;

    const touch = e.touches[0];

    setTouchDragInfo({
      ...touchDragInfo,
      currentX: touch.clientX,
      currentY: touch.clientY,
    });

    // 현재 터치 위치에 있는 요소 찾기
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    // 가장 가까운 블록 찾기
    const blockElement = element.closest('[data-block-id]');
    if (!blockElement) {
      setDropTarget(null);
      return;
    }

    const targetBlockId = blockElement.getAttribute('data-block-id');
    const targetBlock = blockPositions.find(b => b.id === targetBlockId);
    if (!targetBlock || targetBlock.id === draggedBlock.id) return;

    // 드롭 위치 계산
    const rect = blockElement.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;
    const horizontalThreshold = rect.width * 0.3;
    const verticalThreshold = rect.height * 0.3;

    let position: 'above' | 'below' | 'left' | 'right' | null = null;

    if (mouseY < verticalThreshold) {
      position = 'above';
    } else if (mouseY > rect.height - verticalThreshold) {
      position = 'below';
    } else if (mouseX < horizontalThreshold) {
      position = 'left';
    } else if (mouseX > rect.width - horizontalThreshold) {
      position = 'right';
    }

    if (position) {
      setDropTarget({ blockId: targetBlock.id, position });
    } else {
      setDropTarget(null);
    }
  };

  // 터치 종료 (모바일)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!draggedBlock || !dropTarget) {
      setDraggedBlock(null);
      setTouchDragInfo(null);
      setDropTarget(null);
      return;
    }

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) {
      setDraggedBlock(null);
      setTouchDragInfo(null);
      setDropTarget(null);
      return;
    }

    const blockElement = element.closest('[data-block-id]');
    if (!blockElement) {
      setDraggedBlock(null);
      setTouchDragInfo(null);
      setDropTarget(null);
      return;
    }

    const targetBlockId = blockElement.getAttribute('data-block-id');
    const targetBlock = blockPositions.find(b => b.id === targetBlockId);

    if (targetBlock) {
      const fakeEvent = {
        preventDefault: () => {},
      } as React.DragEvent;
      handleDrop(fakeEvent, targetBlock);
    }

    setTouchDragInfo(null);
  };

  // 리사이즈 시작 (가로)
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, block: BlockPosition, direction: 'right' | 'bottom') => {
    if ('touches' in e) {
      // 터치 이벤트는 preventDefault를 나중에 호출
    } else {
      e.preventDefault();
    }
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setResizingBlock({
      blockId: block.id,
      direction,
      startX: clientX,
      startY: clientY,
      startWidth: block.width,
      startHeight: block.height,
    });
  };

  // 리사이즈 중
  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!resizingBlock) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const block = blockPositions.find(b => b.id === resizingBlock.blockId);
    if (!block) return;

    if (resizingBlock.direction === 'right') {
      // 가로 넓이 조정
      const deltaX = clientX - resizingBlock.startX;
      const newWidth = Math.max(50, resizingBlock.startWidth + deltaX); // 최소 50px

      handleWidthResize(block, newWidth);
    } else if (resizingBlock.direction === 'bottom') {
      // 세로 높이 조정
      const deltaY = clientY - resizingBlock.startY;
      const newHeight = Math.max(80, resizingBlock.startHeight + deltaY);

      setBlockPositions(blockPositions.map(b =>
        b.id === block.id ? { ...b, height: newHeight } : b
      ));
    }
  };

  // 리사이즈 종료
  const handleResizeEnd = () => {
    setResizingBlock(null);
  };

  // 가로 넓이 조정 로직
  const handleWidthResize = (block: BlockPosition, newWidth: number) => {
    const rowBlocks = blockPositions.filter(b => b.row === block.row).sort((a, b) => a.x - b.x);
    const blockIndex = rowBlocks.findIndex(b => b.id === block.id);

    if (blockIndex === -1) return;

    const widthDelta = newWidth - block.width;
    const minBlockWidth = 50;

    if (widthDelta > 0) {
      // 넓이 증가
      const rightBlocks = rowBlocks.slice(blockIndex + 1);

      if (rightBlocks.length > 0) {
        // 오른쪽 블록이 있으면 첫 번째 블록의 넓이를 줄임
        const firstRightBlock = rightBlocks[0];
        const newRightWidth = firstRightBlock.width - widthDelta;

        if (newRightWidth >= minBlockWidth) {
          // 오른쪽 블록을 줄일 수 있음 - 바로 인접한 블록만 영향받음
          const updatedBlocks = blockPositions.map(b => {
            if (b.id === block.id) {
              return { ...b, width: newWidth };
            }
            if (b.id === firstRightBlock.id) {
              return { ...b, x: b.x + widthDelta, width: newRightWidth };
            }
            return b;
          });
          setBlockPositions(updatedBlocks);
        }
      } else {
        // 오른쪽에 블록이 없으면 컨테이너 너비 내에서 자유롭게 증가
        const maxWidth = containerWidth - block.x;
        const finalWidth = Math.min(newWidth, maxWidth);
        setBlockPositions(blockPositions.map(b =>
          b.id === block.id ? { ...b, width: finalWidth } : b
        ));
      }
    } else if (widthDelta < 0) {
      // 넓이 감소
      if (newWidth >= minBlockWidth) {
        const rightBlocks = rowBlocks.slice(blockIndex + 1);

        if (rightBlocks.length > 0) {
          // 오른쪽 블록이 있으면 그 블록의 너비를 늘림 - 바로 인접한 블록만 영향받음
          const firstRightBlock = rightBlocks[0];
          const updatedBlocks = blockPositions.map(b => {
            if (b.id === block.id) {
              return { ...b, width: newWidth };
            }
            if (b.id === firstRightBlock.id) {
              return { ...b, x: b.x + widthDelta, width: b.width - widthDelta };
            }
            return b;
          });
          setBlockPositions(updatedBlocks);
        } else {
          // 오른쪽에 블록이 없으면 그냥 줄임
          setBlockPositions(blockPositions.map(b =>
            b.id === block.id ? { ...b, width: newWidth } : b
          ));
        }
      }
    }
  };

  // 마우스/터치 이벤트 리스너 등록
  useEffect(() => {
    if (resizingBlock) {
      const handleMove = (e: MouseEvent | TouchEvent) => {
        handleResizeMove(e);
      };

      const handleEnd = () => {
        handleResizeEnd();
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [resizingBlock, blockPositions]);

  // 다음 단계
  const nextStep = () => {
    if (step === 'name') {
      if (!templateName.trim()) {
        alert('템플릿 이름을 입력해주세요');
        return;
      }
      setStep('blocks');
    } else if (step === 'blocks') {
      if (blockPositions.length === 0) {
        alert('최소 하나의 블록을 추가해주세요');
        return;
      }
      setStep('notification');
    }
  };

  // 템플릿 저장 (알림 설정 단계에서 호출)
  const saveTemplate = () => {
    const blocks: Block[] = blockPositions.map((pos, index) => ({
      id: pos.id,
      type: pos.type,
      order: index,
    } as Block));

    const template = {
      id: `template-${Date.now()}`,
      name: templateName,
      blocks,
      notification,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const existingTemplates = JSON.parse(localStorage.getItem('templates') || '[]');
    localStorage.setItem('templates', JSON.stringify([...existingTemplates, template]));

    router.push('/create');
  };

  // 블록 선택 화면
  if (showPalette) {
    return (
      <main className="min-h-screen bg-white">
        <header className="sticky top-0 bg-white border-b-2 border-black px-4 py-4 flex items-center justify-between z-10">
          <button onClick={() => setShowPalette(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">블록 선택</h1>
          <div className="w-10"></div>
        </header>

        <div className="p-4 space-y-2">
          {blockPalette.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <button
                key={item.type}
                onClick={() => addBlock(item.type)}
                className="w-full p-4 bg-white border-2 border-black rounded-lg hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <Icon size={24} strokeWidth={2} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold mb-1">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

  // Step 1: 템플릿 이름
  if (step === 'name') {
    return (
      <main className="min-h-screen bg-white flex flex-col">
        <header className="bg-white border-b-2 border-black px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">새 템플릿 만들기</h1>
          <div className="w-20"></div>
        </header>

        <div className="flex-1 flex flex-col p-6">
          <div className="mb-auto pt-12">
            <h2 className="text-2xl font-bold mb-2">템플릿 이름을 입력하세요</h2>
            <p className="text-gray-600 mb-6">나만의 기록 템플릿을 만들어보세요</p>

            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="예: 아침 루틴, 운동 기록, 독서 노트..."
              className="w-full px-4 py-4 text-lg border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              autoFocus
            />
          </div>

          <button
            onClick={nextStep}
            className="w-full py-4 bg-black text-white rounded-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2 mt-6"
          >
            다음
            <ChevronRight size={20} strokeWidth={2} />
          </button>
        </div>
      </main>
    );
  }

  // Step 2: 템플릿 구성 (노션 스타일 레이아웃)
  if (step === 'blocks') {
    return (
      <main className="fixed inset-0 bg-gray-50">
        <header className="bg-white border-b-2 border-black px-4 py-4 flex items-center justify-between z-20">
          <button onClick={() => setStep('name')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">{templateName}</h1>
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800"
          >
            다음
          </button>
        </header>

        {/* 노션 스타일 행 기반 레이아웃 */}
        <div className="w-full h-[calc(100vh-72px)] overflow-auto p-4">
          {blockPositions.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  블록을 추가하여<br />템플릿을 만들어보세요
                </p>
              </div>
            </div>
          ) : (
            <div id="blocks-container" className="space-y-3">
              {getAllRows().map((row) => {
                const rowBlocks = getBlocksByRow(row);
                // 행의 전체 높이 = 각 블록의 (y + height) 중 최대값
                const maxHeight = Math.max(...rowBlocks.map(b => b.y + b.height));

                return (
                  <div key={row} className="relative" style={{ height: `${maxHeight}px`, minHeight: '120px' }}>
                    {rowBlocks.map((block) => {
                      const Icon = iconMap[blockPalette.find(p => p.type === block.type)?.icon || 'Type'];
                      const isDragging = draggedBlock?.id === block.id;
                      const isDropTarget = dropTarget?.blockId === block.id;

                      return (
                        <div
                          key={block.id}
                          data-block-id={block.id}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (!draggedBlock || draggedBlock.id === block.id) return;

                            const rect = e.currentTarget.getBoundingClientRect();
                            const mouseX = e.clientX - rect.left;
                            const mouseY = e.clientY - rect.top;
                            const horizontalThreshold = rect.width * 0.3;
                            const verticalThreshold = rect.height * 0.3;

                            let position: 'above' | 'below' | 'left' | 'right' | null = null;

                            if (mouseY < verticalThreshold) {
                              position = 'above';
                            } else if (mouseY > rect.height - verticalThreshold) {
                              position = 'below';
                            } else if (mouseX < horizontalThreshold) {
                              position = 'left';
                            } else if (mouseX > rect.width - horizontalThreshold) {
                              position = 'right';
                            }

                            if (position) {
                              setDropTarget({ blockId: block.id, position });
                            } else {
                              setDropTarget(null);
                            }
                          }}
                          onDrop={(e) => handleDrop(e, block)}
                          className={`bg-white border-2 rounded-lg transition-all ${
                            isDragging ? 'opacity-50 border-gray-300' : 'border-black'
                          }`}
                          style={{
                            position: 'absolute',
                            left: `${block.x}px`,
                            top: `${block.y}px`,
                            width: `${block.width}px`,
                            height: `${block.height}px`,
                          }}
                        >
                          {/* 드롭 인디케이터 */}
                          {isDropTarget && dropTarget.position === 'above' && (
                            <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
                          )}
                          {isDropTarget && dropTarget.position === 'below' && (
                            <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
                          )}
                          {isDropTarget && dropTarget.position === 'left' && (
                            <div className="absolute -left-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
                          )}
                          {isDropTarget && dropTarget.position === 'right' && (
                            <div className="absolute -right-2 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10 pointer-events-none" />
                          )}

                          {/* 블록 헤더 (드래그 핸들) */}
                          <div
                            draggable
                            onContextMenu={(e) => {
                              e.preventDefault();
                            }}
                            onDragStart={(e) => {
                              e.dataTransfer.effectAllowed = 'move';
                              e.dataTransfer.setData('text/plain', block.id);
                              handleDragStart(block);
                            }}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => handleTouchStart(e, block)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className="flex items-center justify-between p-3 border-b-2 border-black cursor-grab active:cursor-grabbing touch-none"
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={18} strokeWidth={2} />
                              <span className="font-semibold text-sm">
                                {blockPalette.find(p => p.type === block.type)?.label}
                              </span>
                            </div>
                            <button
                              draggable={false}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeBlock(block.id);
                              }}
                              onMouseDown={(e) => e.stopPropagation()}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <X size={14} strokeWidth={2} />
                            </button>
                          </div>

                          {/* 블록 내용 */}
                          <div className="p-3" style={{ minHeight: `${block.height - 53}px` }}>
                            <p className="text-xs text-gray-600">
                              {blockPalette.find(p => p.type === block.type)?.description}
                            </p>
                          </div>

                          {/* 가로 리사이즈 핸들 (오른쪽) */}
                          <div
                            draggable={false}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleResizeStart(e, block, 'right');
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleResizeStart(e, block, 'right');
                            }}
                            onDragStart={(e) => e.preventDefault()}
                            className="absolute top-0 -right-1 w-2 h-full cursor-ew-resize hover:bg-blue-500 hover:opacity-50 z-20"
                            style={{ touchAction: 'none' }}
                          />

                          {/* 세로 리사이즈 핸들 (아래) */}
                          <div
                            draggable={false}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              handleResizeStart(e, block, 'bottom');
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleResizeStart(e, block, 'bottom');
                            }}
                            onDragStart={(e) => e.preventDefault()}
                            className="absolute -bottom-1 left-0 w-full h-2 cursor-ns-resize hover:bg-blue-500 hover:opacity-50 z-20"
                            style={{ touchAction: 'none' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 블록 추가 FAB */}
        <button
          onClick={() => setShowPalette(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-lg hover:bg-gray-800 flex items-center justify-center z-30"
        >
          <Plus size={28} strokeWidth={2} />
        </button>
      </main>
    );
  }

  // Step 3: 알림 설정 (마지막)
  if (step === 'notification') {
    return (
      <main className="min-h-screen bg-white flex flex-col">
        <header className="bg-white border-b-2 border-black px-4 py-4 flex items-center justify-between">
          <button onClick={() => setStep('blocks')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <h1 className="text-lg font-bold">알림 설정</h1>
          <div className="w-20"></div>
        </header>

        <div className="flex-1 flex flex-col p-6">
          <div className="mb-auto">
            <h2 className="text-2xl font-bold mb-2">기록 알림을 설정하세요</h2>
            <p className="text-gray-600 mb-6">정기적으로 기록할 수 있도록 알림을 받아보세요</p>

            <div className="p-5 border-2 border-black rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} strokeWidth={2} />
                  <span className="font-bold">알림 받기</span>
                </div>
                <button
                  onClick={() => setNotification({ ...notification, enabled: !notification.enabled })}
                  className={`px-5 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                    notification.enabled
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300'
                  }`}
                >
                  {notification.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {notification.enabled && (
                <div className="space-y-3 mt-4 pt-4 border-t-2 border-gray-200">
                  <div>
                    <label className="block text-sm font-medium mb-2">알림 주기</label>
                    <select
                      value={notification.frequency || 'daily'}
                      onChange={(e) => setNotification({ ...notification, frequency: e.target.value as any })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                    >
                      <option value="daily">매일</option>
                      <option value="weekly">매주</option>
                      <option value="monthly">매월</option>
                      <option value="custom">사용자 지정</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">알림 시간</label>
                    <input
                      type="time"
                      value={notification.time || '09:00'}
                      onChange={(e) => setNotification({ ...notification, time: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={saveTemplate}
            className="w-full py-4 bg-black text-white rounded-lg font-bold hover:bg-gray-800 flex items-center justify-center gap-2 mt-6"
          >
            완료
          </button>
        </div>
      </main>
    );
  }

  // 여기 도달하면 안됨 (모든 step이 위에서 처리됨)
  return null;
}
